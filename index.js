const router = require('./lib/router');
const context = require('./lib/context');

/**
 * Default options
 * @type {{}}
 */

let options = {
     config: false,
     onError: false,
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
 * @param req
 * @param res
 * @param next
 * @param error
 */

const onError = (req, res, next, error) => {
     const {logger = console} = context.plugins;
     logger.error(error);
     res.status(500).end(error);
};

/**
 * Setup serpent on top of express
 * @param app
 * @param opts
 */

exports.setup = (app, opts) => {
     let config = {...options, ...opts};

     /**
      * Load application middle wares
      */

     /**
      * Load context
      */

     context.set('app', app);
     context.set('config', config);

     context.init();
     router.init(context);

     /**
      * Register global error handler
      */

     const errorHandler = typeof config.onError === 'function' ? config.onError : onError;
     app.use(errorHandler);
};