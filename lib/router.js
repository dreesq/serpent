const {get} = require('./utils');

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
     const {config, app} = context;

     if (get(config, 'routes.handler', false)) {
          app.post(config.routes.handler, handle);
     }

     if (get(config, 'routes.actions', false)) {
          app.get(config.routes.actions, list);
     }
};