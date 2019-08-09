const io = require('socket.io');
const {SERVER_LISTENING} = require('../constants');
const fs = require('fs');
const util = require('util');
const path = require('path');
const {d} = require('../utils');

/**
 * Promisify functions
 */

const readFile = util.promisify(fs.readFile);

/**
 * Socket server instance
 * @type {boolean}
 */

let sio = false;

/**
 * Socket server plugin
 * @param context
 */

exports.init = context => {
    const {events, config, auth} = context.plugins;

    /**
     * After http server started listening
     */

    events.on(SERVER_LISTENING, async () => {
        const {server} = context;
        const ssl = config.get('server.ssl');

        if (ssl) {
            const appPath = path.dirname(require.main.filename);

            const key = await readFile(path.join(appPath, ssl.key));
            const cert = await readFile(path.join(appPath, ssl.cert));

            sio = io(server, {cert, key});
        } else {
            sio = io(server);
        }

        const {i18n} = context.plugins;
        const locale = config.get('plugins.i18n.defaultLocale', 'en');
        const translator = i18n.translator(locale);

        /**
         * On new socket connection
         */

        sio.on('connection', socket => {
            socket.user = false;

            socket.on('login', async token => {
                try {
                    d(`(ws:${socket.id}) Trying to authenticate.`);
                    socket.user = await auth.getUser(token, translator.translate);
                    d(`(ws:${socket.id}) Authenticated user:`, socket.user);
                    socket.join(`user-${socket.user._id}`);
                    socket.emit('login', 1);
                } catch(e) {
                    d(`(ws:${socket.id}) login error`, e.stack);
                    socket.emit('login', 0);
                }
            });

            socket.on('logout', () => {
                if (!socket.user) {
                    return;
                }

                d(`(ws:${socket.id}) Logging out.`);
                socket.leave(`user-${socket.user._id}`);
                socket.emit('logout', 1);
                delete socket.user;
                d(`(ws:${socket.id}) Logged out.`);
            });
        });
    });
};

exports.build = req => {
    if (req.user) {
        req.user.emit = (event, data) => {
            sio.in(`user-${req.user._id}`).emit(event, data);
        };
    }

    return sio;
};