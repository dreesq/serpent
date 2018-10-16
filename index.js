const router = require('./lib/router');
const context = require('./lib/context');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');

/**
 * Default options
 * @type {{}}
 */

let options = {
     config: false,
     onError: false,
     routes: {
          actions: '/',
          handler: '/'
     },
     autoload: {
          config: true,
          actions: true,
          models: true
     }
};

/**
 * Configure helper for actions
 * @param opts
 */

exports.config = opts => {
     return handler => {
          router.register(handler, opts);
     };
};

/**
 * Register a custom plugin
 * @param name
 * @param plugin
 */

exports.register = (name, plugin) => {
     context.register(name, plugin);
};

/**
 * On application error
 * @param error
 * @param req
 * @param res
 * @param next
 */

const onError = (error, req, res, next) => {
     const logger = plugin('logger', console);
     logger.error(error);

     let response = {
          errors: [
               error
          ]
     };

     if (typeof error === 'object') {
          response = error;
     }

     res.status(500).json(response);
};

/**
 * Initialize application context
 * @param app
 * @param config
 */

const initContext = (app, config) => {
     context.set('app', app);
     context.set('config', config);
     context.init();
};

/**
 * Initialize global middle wares
 */

const initMiddlewares = () => {
     const app = context.get('app');
     const config = plugin('config');

     if (config.get('server.parsers', false)) {
          app.use(bodyParser.json());
          app.use(bodyParser.urlencoded({ extended: true }));
          app.use(cookieParser());
     }

     if (config.get('server.helmet', false)) {
          app.use(helmet());
     }

     if (config.get('server.cors', false)) {
          app.use(cors(config.get('server.cors')));
     }

     if (config.get('server.session', false)) {
          app.use(session(config.get('server.session')));
     }
};

/**
 * Initialize application router
 */

const initRouter = () => {
     const app = context.get('app');
     const config = context.get('config');
     router.init(context);

     /**
      * Register global error handler
      */

     const errorHandler = typeof config.onError === 'function' ? config.onError : onError;
     app.use(errorHandler);
};

/**
 * Setup serpent on top of express
 * @param app
 * @param opts
 */

exports.setup = (app, opts) => {
     let config = {
          ...options,
          ...opts
     };

     initContext(app, config);
     initMiddlewares();
     initRouter();
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
 * Creates http server given options
 */

exports.start = () => {
     const config = plugin('config');
     const logger = plugin('logger', console);

     const app = context.get('app');
     const port = config.get('server.port', 3000);

     app.listen(port, () => logger.info(`Server listening on port ${port}.`));
};
