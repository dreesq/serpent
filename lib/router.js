/**
 * All actions
 * @type {{}}
 */

const actions = {};

/**
 * Returns a list with available actions
 * @param req
 * @param res
 */

const list = (req, res) => {

};

/**
 * Handler function
 * @param req
 * @param res
 */

const handle = (req, res) => {

};

/**
 * Registers an action
 * @param handler
 * @param opts
 */

exports.register = (handler, opts) => {

};

/**
 * Initialize the router
 * @param context
 */

exports.init = context => {
     const app = context.get('app');
     const config = context.get('config');

     if (config.routes.handler) {
          app.post(config.routes.handler, handle);
     }

     if (config.routes.actions) {
          app.get(config.routes.actions, list);
     }
};