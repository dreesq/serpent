const {get} = require('./utils');
const path = require('path');
const fs = require('fs');


/**
 * Router vars
 * @type {{}}
 */

let app = {};
let actions = {};
let cache = null;

/**
 * Returns a list with available actions
 * @param req
 * @param res
 */

const list = (req, res) => {
     if (!cache) {
          cache = Object.keys(actions).reduce((all, key) => {
               let current = actions[key];

               if (!current.visible) {
                    return all;
               }

               return {
                    ...all,
                    [key]: current.input || {}
               }
          }, {});
     }

     res.json(cache);
};

/**
 * Handler function
 * @param req
 * @param res
 */

const handle = (req, res) => {

};

/**
 * Returns an express compatible handler
 * @param handler
 * @returns {Function}
 */

const makeHandler = handler => {
     return async (req, res) => {
          try {
               const result = await handler({
                    req,
                    res,
/*                    i18n,
                    session,
                    socket,
                    mailer,
                    user,
                    db,
                    validator,
                    axios*/
               });

               if (!result) {
                    return;
               }

               if (typeof result === 'object') {
                    return res.json(result);
               }
          } catch (e) {
               res.status(500).end();
          }
     };
};

/**
 * Registers an action
 * @param handler
 * @param opts
 */

exports.register = register = (handler, opts) => {
     if (opts.name && actions[opts.name]) {
          throw new Error(`Action with name ${opts.name} already registered.`);
     }

     let name = opts.name || (opts.route ? `${opts.route.method}-${opts.route.path}` : false);

     if (!name) {
          throw new Error(`Action has no route nor method name.`);
     }

     actions[name] = {
          handler,
          visible: !!opts.route,
          ...opts
     };

     if (opts.route) {
          app[opts.route.method](opts.route.path, makeHandler(handler));
     }
};

/**
 * Initialize the router
 * @param context
 */

exports.init = context => {
     const config = context.get('config');
     app = context.get('app');

     if (get(config, 'routes.handler', false)) {
          app.post(config.routes.handler, handle);
     }

     if (get(config, 'routes.actions', false)) {
          app.get(config.routes.actions, list);
     }

     if (get(config, 'autoload.actions', false)) {
          const appPath = path.dirname(require.main.filename);
          const actions = fs.readdirSync(path.join(appPath, './actions'));

          for (const action of actions) {
               let actionPath = path.join(appPath, './actions', action);

               if (fs.statSync(actionPath).isFile()) {
                    require(actionPath);
               }
          }
     }
};