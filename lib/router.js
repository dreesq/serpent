const {get, error, load} = require('./utils');
const path = require('path');
const {APP_PATH, MODULE_PATH} = require('../constants');

/**
 * Router vars
 * @type {{}}
 */

let app = {};
let actions = {};
let middleware = {};
let cache = null;

let plugins = {};

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
    const {i18n} = plugins;

    if (!Array.isArray(req.body)) {
        return res.status(400).json(error(i18n.translate('errors.invalidAction')));
    }

    const [action, payload] = req.body;
    req.body = payload;

    if (!actions[action]) {
        return res.status(400).json(error(i18n.translate('errors.invalidAction')));
    }

    const invokedAction = actions[action];
    const middleware = invokedAction.middleware;

    req.name = action;

    if (middleware.length) {
        let processMiddleware = (key = 0) => {
            middleware[key](req, res, async error => {
                if (error) {
                    return;
                }

                if (++key < middleware.length) {
                    return processMiddleware(key);
                }

                return await makeHandler(invokedAction)(req, res);
            });
        };

        return processMiddleware();
    }

    await makeHandler(invokedAction)(req, res);
};

/**
 * Returns an express compatible handler
 * @param handler
 * @param actionInput
 * @returns {Function}
 */

const makeHandler = ({handler, input: actionInput}) => {
    const {
        input: inputPlugin,
        axios,
        db,
        mail,
        validator,
        events,
        socket,
        config,
        i18n,
        logger = console
    } = plugins;

    return async (req, res) => {
        try {
            const user = req.user ? req.user : false;
            const lang = user ? user.locale : config.get('plugins.i18n.defaultLocale', 'en');
            const translate = req.translate = i18n.translator(lang).translate;

            const {errors, input} = await inputPlugin.handle(req, actionInput);

            if (errors) {
                return res.status(400).json({errors});
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
                session: req.session,
                socket: socket.getSocket(),
                user,
                i18n: translate,
                validator: validator.build(translate),
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

exports.registerAction = registerAction = (handler, opts) => {
    let name = opts.name || (opts.route ? `${opts.route.method}-${opts.route.path}` : false);
    opts.enabled = typeof opts.enabled === 'undefined' ? true : opts.enabled;

    if (!opts.enabled) {
        return;
    }

    if (!name) {
        throw new Error(`Action has no route nor method name.`);
    }

    /**
     * Replace string middleware with functions
     */

    let middlewareList = opts.middleware || [];

    for (const key in middlewareList) {
        if (!middlewareList.hasOwnProperty(key)) {
            continue;
        }

        const current = middlewareList[key];

        if (typeof current === 'string') {
            let [handler, options] = current.split(':');

            if (!middleware[handler]) {
                continue;
            }

            if (options) {
                options = options.split(',');
            }

            middlewareList[key] = middleware[handler].length === 3 ? middleware[handler] : middleware[handler](options);
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
 * Initialize the router
 * @param context
 */

exports.init = async context => {
    const {config: configPlugin} = context.get('plugins');
    const config = context.get('config');

    app = context.get('app');
    plugins = context.get('plugins');

    if (get(config, 'routes.handler')) {
        app.post(config.routes.handler, handle);
    }

    if (get(config, 'routes.actions')) {
        app.get(config.routes.actions, list);
    }

    /**
     * Load core middleware
     */

    await load(MODULE_PATH, 'middlewares', (name, handler) => {
        name = name.substring(0, name.lastIndexOf('.'));
        middleware[name] = handler;
    });

    /**
     * Autoload middleware
     */

    if (get(config, 'autoload.middlewares')) {
        await load(APP_PATH, 'middlewares', (name, handler) => {
            name = name.substring(0, name.lastIndexOf('.'));
            middleware[name] = handler;
        });
    }

    /**
     * Load core actions
     */

    await load(MODULE_PATH);

    /**
     * Autoload actions
     */

    if (get(config, 'autoload.actions', false)) {
        await load(APP_PATH);
    }
};