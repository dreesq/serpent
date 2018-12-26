const {get, error} = require('./utils');
const {promisify} = require('util');
const path = require('path');
const fs = require('fs');
const serpent = require('../index');

/**
 * Promisify functions
 */

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

/**
 * Router vars
 * @type {{}}
 */

let app = {};
let actions = {};
let middleware = {};
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

const handle = async (req, res) => {
     if (!Array.isArray(req.body)) {
          return res.status(400).json(error('Invalid action sent.'));
     }

     const [action, payload] = req.body;
     req.body = payload;

     if (!actions[action]) {
         return res.status(400).json(error('Invalid action sent.'));
     }

     const invokedAction = actions[action];
     const middleware = invokedAction.middleware;

     if (middleware.length) {
          for (const key in middleware) {
              middleware[key](req, res, async error => {
                    if (error) {
                         return;
                    }

                    if (key + 1 < middleware.length) {
                         return middleware[key + 1](req, res);
                    }

                    return await makeHandler(invokedAction)(req, res);
               });
          }

          return;
     }

     await makeHandler(invokedAction)(req, res);
};

/**
 * Returns an express compatible handler
 * @param handler
 * @param actionInput
 * @returns {Function}
 */

const makeHandler = ({ handler, input: actionInput }) => {
     const {
          input: inputPlugin,
          axios,
          db,
          mail,
          validator,
          events,
          socket,
          config,
          logger = console
     } = serpent.getPlugins();

     return async (req, res) => {
          try {
               const {errors, input} = await inputPlugin.handle(req, actionInput);

               if (errors) {
                    return res.status(400).json({ errors });
               }

               const result = await handler({
                    req,
                    res,
                    input,
                    axios,
                    db,
                    mail,
                    events,
                    config,
                    validator,
                    session: req.session,
                    socket: socket.getSocket(),
                    user: req.user || false
/*                    i18n,*/
               });

               if (!result) {
                    return res.end();
               }

               if (typeof result === 'object') {
                    return res.json(result);
               }

               return res.end(result);
          } catch (e) {
               logger.error(e.stack);
               res.status(500).json(error(e.message));
          }
     };
};

/**
 * Registers an action
 * @param handler
 * @param opts
 */

exports.register = register = (handler, opts) => {
     let name = opts.name || (opts.route ? `${opts.route.method}-${opts.route.path}` : false);

     if (!name) {
          throw new Error(`Action has no route nor method name.`);
     }

    /**
     * Replace string middleware with functions
     */

    let middlewareList = opts.middleware || [];

    for (const key in middlewareList) {
        const current = middlewareList[key];

        if (typeof current === 'string') {
            const [handler, options] = current.split(':');

            if (!middleware[handler]) {
                continue;
            }

            middlewareList[key] = middleware[handler](options);
        }
    }

    /**
     * Register route or action
     * @type {{handler: *, visible: boolean}}
     */

     actions[name] = {
          handler,
          middleware: middlewareList,
          visible: !opts.route,
          ...opts
     };

    if (opts.route) {
          app[opts.route.method].apply(app, [opts.route.path, ...middlewareList, makeHandler(actions[name])]);
     }
};

/**
 * Helper function for loading folder
 * @param appPath
 * @param type
 * @param callback
 * @returns {Promise<void>}
 */

const load = async (appPath = '.', type = 'actions', callback = false) => {
    const actions = await readdir(path.join(appPath, `./${type}`));

    for (const action of actions) {
        let actionPath = path.join(appPath, `./${type}`, action);
        let itemStat = await stat(actionPath);

        if (!itemStat.isFile()) {
             continue;
        }

        const required = require(`${appPath === '.' ? '../' : ''}${actionPath}`);

        if (callback) {
             callback(action, required);
        }
    }
};

/**
 * Initialize the router
 * @param context
 */

exports.init = async context => {
     const config = context.get('config');
     app = context.get('app');

     if (get(config, 'routes.handler', false)) {
          app.post(config.routes.handler, handle);
     }

     if (get(config, 'routes.actions', false)) {
          app.get(config.routes.actions, list);
     }

    /**
     * Load middleware
     */

    await load('.', 'middlewares', (name, handler) => {
         name = name.substring(0, name.lastIndexOf('.'));
         middleware[name] = handler;
    });

    /**
     * Core actions
     */

    await load();

    /**
     * Autoload actions
     */

    if (get(config, 'autoload.actions', false)) {
        const appPath = path.dirname(require.main.filename);
        await load(appPath);
    }
};