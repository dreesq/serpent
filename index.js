const router = require('./lib/router');
const context = require('./lib/context');

/**
 * Default options
 * @type {{}}
 */

let options = {
     debug: true,
     auth: true,
     security: true,
     parsers: true,
     cors: true,
     config: false,
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

exports.Action = opts => {
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
 * Setup serpent on top of express
 * @param app
 * @param opts
 */

exports.Setup = (app, opts) => {
     let config = {...options, ...opts};

     context.set('app', app);
     context.set('config', config);

     context.init();
     router.init(context);
};