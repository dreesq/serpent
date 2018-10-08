const router = require('./lib/router');
const context = require('./lib/context');

/**
 * Default options
 * @type {{}}
 */

let options = {
     security: true,
     parsers: true,
     cors: true,
     config: false,
     socket: false,
     autoload: {
          config: true,
          actions: true,
          models: true
     },
     routes: {
          actions: '/actions',
          handler: '/'
     }
};

/**
 * Configure helper for actions
 * @param opts
 */

exports.configure = opts => {
     return handler => {
          router.register(handler, opts);
     };
};

/**
 * Setup serpent on top of express
 * @param app
 * @param opts
 */

exports.setup = (app, opts) => {
     let config = {...options, ...opts};

     context.set('app', app);
     context.set('config', config);

     context.init();
     router.init(context);
};