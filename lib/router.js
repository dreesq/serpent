const {get, error, load, d} = require('../utils');
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

    const [action, payload = {}] = req.body;
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
        firebase,
        logger = console,
        utils,
        redis,
        i18n,
        stripe,
        es
    } = plugins;

    return async (req, res) => {
        try {
            const user = req.user ? req.user : false;
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
                ...(socket ? {socket: socket.build(req)} : {}),
                ...(firebase ? {firebase: firebase.build(req)} : {}),
                ...(stripe ? {stripe: stripe.build(req)} : {}),
                ...(es ? {es: es.build(req)} : {}),
                user,
                redis,
                i18n,
                t: req.translate,
                validator: validator.build(req),
                utils: utils.build(req),
                logger
            });

            if (typeof result === 'undefined') {
                return;
            }

            return res.json(result);
        } catch(e) {
            logger.error(e.stack);
            res.status(400).json(error(e.message));
        }
    };
};

/**
 * Given an action name,
 * returns its registered handler
 * @param action
 */

exports.getAction = getAction = (action) => {
    return actions[action] || {};
};

/**
 * Fakes the request object and allows running
 * @param action
 * @param input
 * @param extra
 * @returns {Promise<*|*>}
 */

exports.runAction = (action, input = {}, extra = {}) => new Promise((resolve, reject) => {
    const {handler} = getAction(action);

    if (!Object.keys(action).length) {
        throw new Error(`Tried running unexisting action ${action}.`);
    }

    let func = makeHandler({
        handler,
        input
    });

    let fakeReq = {
        user: extra.user,
        translate: extra.translate,
        body: input
    };

    let fakeRes = {
        status() {
            return fakeRes;
        },
        json: resolve,
        end: resolve
    };

    try {
        func(fakeReq, fakeRes);
    } catch(e) {
        reject(e);
    }
});

/**
 * Registers an action
 * @param handler
 * @param opts
 */

exports.registerAction = registerAction = (handler, opts) => {
    let name = opts.name || (opts.route ? `${opts.route[0]}-${opts.route[1]}` : false);
    let enabled = typeof opts.enabled === 'undefined' ? true : opts.enabled;

    if (!enabled) {
        return;
    }

    if (!name) {
        throw new Error(`Action has no route nor method name.`);
    }

    /**
     * Replace string middleware with functions
     */

    let middlewareList = opts.middleware || [];
    middlewareList.unshift('i18n');

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

    d(`${actions[name] ? 'Overwriting' : 'Registering'} action with name ${name}`);

    /**
     * Register route or action
     * @type {{handler: *, visible: boolean}}
     */

    cache = null;

    actions[name] = {
        handler,
        middleware: middlewareList,
        visible: !opts.route,
        ...opts
    };

    if (opts.route) {
        app[opts.route[0]].apply(app, [opts.route[1], ...middlewareList, makeHandler(actions[name])]);
    }
};

/**
 * Initialize the router
 * @param context
 */

exports.init = async context => {
    const config = context.get('config');

    app = context.get('app');
    plugins = context.get('plugins');

    if (get(config, 'actions.handler')) {
        app.post(config.actions.handler, handle);
    }

    if (get(config, 'actions.list')) {
        app.get(config.actions.list, list);
    }

    /**
     * Load core middleware
     */

    d('Loading middlewares.');

    await load(MODULE_PATH, 'middlewares', (name, handler) => {
        name = name.substring(0, name.lastIndexOf('.'));
        middleware[name] = handler;
    });

    /**
     * Autoload middleware
     */

    let middlewarePath = get(config, 'autoload.middlewares', false);
    middlewarePath = middlewarePath === true ? 'middlewares' : middlewarePath;

    if (middlewarePath) {
        await load(APP_PATH, middlewarePath, (name, handler) => {
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

    let actionsPath = get(config, 'autoload.actions', false);
    actionsPath = actionsPath === true ? 'actions' : actionsPath;

    if (actionsPath) {
        await load(APP_PATH, actionsPath);
    }
};