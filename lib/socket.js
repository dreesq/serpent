const io = require('socket.io');
const {SERVER_LISTENING} = require('../constants');
const fs = require('fs');
const util = require('util');
const path = require('path');

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
     const {events, config} = context.plugins;

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

              sio = io(server, {
                  cert,
                  key
              });
          } else {
              sio = io(server);
          }

         /**
          * If authorization is present, authenticate the user
          */

         sio.on('connection', socket => {
              socket.user = false;


         });
     });
};

exports.methods = {
     getSocket() {
          return sio;
     }
};