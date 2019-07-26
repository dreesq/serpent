const router = require('./lib/router');
const context = require('./lib/context');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const http = require('http');
const spdy = require('spdy');
const {SERVER_LISTENING, APP_PATH} = require('./constants');
const utils = require('./utils');
const fs = require('fs');
const util = require('util');
const path = require('path');
const package = require('./package.json');
const deepmerge = require('deepmerge');

/**
 * Promisify functions
 */

const readFile = util.promisify(fs.readFile);

/**
 * Default options
 * @type {{}}
 */

let defaultOptions = {
    config: false,
    onError: false,
    actions: {
        batch: false,
        list: '/',
        handler: '/'
    },
    autoload: {
        config: true,
        actions: true,
        models: true,
        middlewares: true
    }
};

/**
 * Export utilities
 */

exports.utils = utils;

/**
 * Configure helper for actions
 * @param opts
 */

exports.config = config = opts => {
    return handler => {
        router.registerAction(handler, opts);

        /**
         * Allow updating options on already
         * registered routes
         */

        return others => {
            router.registerAction(handler, {
                ...opts,
                ...others
            });
        };
    };
};

/**
 * Register a custom plugin
 * @param name
 * @param plugin
 */

exports.register = (name, plugin) => {
    return context.registerPlugin(name, plugin, true);
};

/**
 * On application error
 * @param error
 * @param req
 * @param res
 * @param next
 */

const onError = (error, req, res, next) => {
    const isProd = process.env.NODE_ENV !== 'development';
    const logger = plugin('logger');
    const message = error instanceof Error ? error.stack : error;

    logger.error(error);
    res.status(500).json(error(!isProd ? message : req.translate('errors.genericError')));
};

/**
 * Initialize application context
 * @param app
 * @param config
 */

const initContext = async (app, config) => {
    context.set('app', app);
    context.set('config', config);
    await context.init();
};

/**
 * Initialize global middle wares
 */

const initMiddlewares = async () => {
    const app = context.get('app');
    const config = plugin('config');

    if (!app) {
        return;
    }

    if (context.get('config').mamba) {
        return;
    }

    if (config.get('server.parsers')) {
        app.use(bodyParser.json({
            verify(req, res, buf, encoding) {
                req.rawBody = buf.toString();
            }
        }));
        app.use(bodyParser.urlencoded({extended: true}));
        app.use(cookieParser());
    }

    if (config.get('server.helmet')) {
        app.use(helmet());
    }

    if (config.get('server.cors')) {
        app.use(cors(config.get('server.cors')));
    }

    if (config.get('server.session')) {
        app.use(session(config.get('server.session')));
    }
};

/**
 * Register additional helpers
 */

const buildHelpers = () => {
    /**
     * Method helpers
     */

    const methods = {
        del: 'delete',
        put: 'put',
        post: 'post',
        get: 'get',
        update: 'update',
        head: 'head',
        options: 'options',
        patch: 'patch'
    };

    for (const key in methods) {
        exports[key] = (path, handler) => {
            return config({
                route: [methods[key], path]
            })(
                handler
            );
        };
    }

    exports.action = (name, handler) => {
        return config({
            name
        })(
            handler
        );
    };

    /**
     * Group helper
     */

    exports.group = opts => {
        return (...args) => {
            for (const action of args) {
                action(opts);
            }
        };
    };
};

/**
 * Initialize application router
 */

const initRouter = async () => {
    const app = context.get('app');
    const config = context.get('config');

    await router.init(context);

    /**
     * Register global error handler
     */

    if (app) {
        const errorHandler = typeof config.onError === 'function' ? config.onError : onError;
        app.use(errorHandler);
    }
};

/**
 * Setup serpent on top of express
 * @param app
 * @param options
 */

exports.setup = async (app, options) => {

    let config = deepmerge(defaultOptions, options);

    /**
     * Attach helpers to
     * the exported object
     */

    buildHelpers();

    /**
     * Overwrite express's listen function in
     * order to send the listening event
     * @param args
     */

    app.__listen = app.listen;
    app.listen = (...args) => {
        const events = plugin('events');
        app.__listen(...args);
        events.emit(SERVER_LISTENING);
    };

    await initContext(app, config);
    await initMiddlewares();
    await initRouter();
};

/**
 * Runs the application without the http server
 * @param opts
 * @returns {Promise<void>}
 */

exports.standalone = async (opts) => {
    let config = {
        ...options,
        ...opts
    };

    buildHelpers();

    await initContext(false, config);
    await initMiddlewares();
    await initRouter();
};

/**
 * Utility for calling an action, note that called
 * actions skip middleware flow
 *
 * @param action
 * @param payload
 * @param extra
 * @returns
 */

exports.call = async (action, payload = {}, extra = {user: false}) => {
    if (!action) {
        throw new Error(`Call helper cannot be used without required action parameter.`);
    }

    let result = {
        data: false,
        errors: false
    };

    const res = await router.runAction(action, payload, extra);

    if (res.errors) {
        result.errors = res.errors;
    } else {
        result.data = res;
    }

    return result;
};

/**
 * Returns the global application context
 */

exports.getContext = () => {
    return context;
};

/**
 * Returns Express's application object
 * @returns {boolean}
 */

exports.getApp = () => {
    return context.app;
};

/**
 * Returns all plugins
 * @returns {*}
 */

exports.getPlugins = () => {
    return context.get('plugins');
};

/**
 * Returns a plugin by name
 * @param name
 * @param fallback
 */

exports.plugin = plugin = (name, fallback) => {
    if (!name) {
        return context.get('plugins');
    }

    return context.get('plugins')[name] || fallback;
};

/**
 * Helper for overwriting actions
 * @param action
 * @param reconfig
 */

exports.override = (action = '', reconfig) => {
    let registeredAction = router.getAction(action);
    const {handler, ...options} = registeredAction;
    const newOptions = reconfig(options);
    return config(newOptions)(handler);
};

/**
 * Creates http server given options
 */

exports.start = async (port = 3000) => {
    const config = plugin('config');
    const logger = plugin('logger');
    const events = plugin('events');

    const app = context.get('app');
    port = config.get('server.port', port);

    const ssl = config.get('server.ssl');

    const env = process.env.NODE_ENV || 'development';
    const debug = config.get('debug', false);
    const name = config.get('name', 'app');

    logger.verbose(`
    
             \`/+-                                 
            -+++++.                               
           .++++:\`                                
           /+++\`           .:///:-\`               
           +++.          .+++++++++/\`             
           :++\`         :+++++-\` \`-++.            
           \`++-       .+++++:\`     .++\`           
            .++-    \`:+++++-       \`++:           
             \`:++/:/+++++/\`        -++/           
               \`-/++++/:\`        \`:+++:           
                    \`          .+++++/\`           
                                \`-:-.
                    
            name: ${name}               
            version: ${package.version}
            env: ${env}
            debug: ${debug}
    `);

    const onListen = () => logger.info(`Listening on port ${port}`);

    if (context.get('config').mamba) {
        return app.__listen(port, onListen);
    }

    let server;

    if (ssl) {
        const key = await readFile(path.join(APP_PATH, ssl.key), 'utf-8');
        const cert = await readFile(path.join(APP_PATH, ssl.cert), 'utf-8');

        server = spdy.createServer({
            key,
            cert
        }, app);
    } else {
        server = http.createServer(app);
    }

    context.set('server', server);
    events.emit(SERVER_LISTENING);
    server.listen(port, onListen);
};