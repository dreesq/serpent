const {get, error, load, d} = require('../utils');
const {APP_PATH, MODULE_PATH, SOURCE_LOCAL, SOURCE_REMOTE} = require('../constants');

/**
 * Router vars
 * @type {{}}
 */

let app = {};
let actions = {};
let middleware = {};
let cache = null;
let ctx = null;
let plugins = {};
let build = {};

/**
 * Returns a list with available actions
 * @param req
 * @param res
 */

const list = (req, res) => {
    if (!cache) {
        cache = JSON.stringify(Object.keys(actions).reduce((all, key) => {
            let current = actions[key];

            if (!current.visible) {
                return all;
            }

            return {
                ...all,
                [key]: current.input || {}
            }
        }, {}));
    }

    res.end(cache);
};

/**
 * Handler function
 * @param req
 * @param res
 */

const handle = async (req, res) => {
    const {i18n} = plugins;
    const config = ctx.get('config');

    if (!Array.isArray(req.body)) {
        return res.status(400).json(error(i18n.translate('errors.invalidAction')));
    }

    const runAction = async (currentAction = []) => {
        const [action, payload = {}] = currentAction;
        req.body = payload;

        if (!actions[action]) {
            return res.status(400).json(error(i18n.translate('errors.invalidAction')));
        }

        const invokedAction = actions[action];
        const middleware = invokedAction.middleware;

        req.name = action;

        let processMiddleware = (key = 0) => new Promise(resolve => {
            middleware[key](req, res, async error => {
                if (error) {
                    return;
                }

                if (++key < middleware.length) {
                    return processMiddleware(key);
                }

                const {handler, input, ...actionOptions} = invokedAction;

                await makeHandler({
                    handler,
                    source: SOURCE_REMOTE,
                    actionOptions,
                    input
                })(req, res);
                resolve();
            });
        });

        if (middleware.length) {
            return await processMiddleware();
        }

        const {
            handler,
            input,
            ...actionOptions
        } = invokedAction;

        await makeHandler({
            handler,
            input,
            source: SOURCE_REMOTE,
            actionOptions
        })(req, res);
    };

    if (!config.actions.batch) {
        return await runAction(req.body);
    }

    const isBatchRequest = (req.body || []).every(i => Array.isArray(i));

    if (!isBatchRequest) {
        return await runAction(req.body);
    }

    const results = [];
    res._json = res.json;

    res.status = () => {
        return res;
    };

    const actionsList = req.body;

    await Promise.all(actionsList.map(action => new Promise(resolve => {
        res.json = function(result) {
            results.push({
                [action[0]]: result
            });
        };

        req.body = action[1];
        runAction(action).finally(resolve);
    })));

    return res._json(results);
};

/**
 * Returns an express compatible handler
 * @param handler
 * @param actionInput
 * @param source
 * @param actionOptions
 * @returns {Function}
 */

const makeHandler = ({
     handler,
     input: actionInput,
     source = SOURCE_REMOTE,
     actionOptions = {}
}) => {
    const isDev = process.env.NODE_ENV !== 'production';

    const {
        input: inputPlugin,
        axios,
        db,
        mail,
        events,
        config,
        logger = console,
        redis,
        i18n,
        auth
    } = plugins;

    return async (req, res) => {
        const user = req.user ? req.user : false;
        const mergedInput = inputPlugin.merge(req);

        try {
            const {errors, input} = await inputPlugin.validate(mergedInput, actionInput, req.translate);

            if (errors) {
                return res.status(400).json({errors});
            }

            if (typeof handler !== 'function') {
                return res.json(handler);
            }

            const makeCtx = async () => {
                const ctx = {
                    req,
                    res,
                    input,
                    axios,
                    db,
                    mail,
                    events,
                    config,
                    session: req.session,
                    t: req.translate,
                    user,
                    redis,
                    i18n,
                    logger,
                    source,
                    options: actionOptions,
                    auth
                };

                for (const name in build) {
                    ctx[name] = await build[name](req, res, ctx);
                }

                return ctx;
            };

            const result = await handler(await makeCtx());

            if (typeof result === 'undefined') {
                return;
            }

            return res.json(result);
        } catch(e) {
            const status = e.status || 500;
            const info = {
                debug: {
                    ...((e instanceof Error || e.message) ? {
                        message: e.message,
                        stack: e.stack
                    } : {
                        message: e
                    }),
                    source,
                    user,
                    input: mergedInput,
                },
                message: e.message ? e.message : e
            };

            if (status === 500) {
                logger.json({
                    ip: req ? req.connection.remoteAddress : 'standalone',
                    user,
                    source,
                    input: mergedInput,
                    debug: info.debug
                }, 'error');
            }

            let message = isDev ? info : req.translate('errors.genericError');
            res.status(status).json(error(message));
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
    const {handler, ...actionOptions} = getAction(action);

    if (!Object.keys(action).length) {
        throw new Error(`Tried running unexisting action ${action}.`);
    }

    let func = makeHandler({
        handler,
        input,
        source: SOURCE_LOCAL,
        actionOptions
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

    d(`${actions[name] ? '~ action' : '+ action'} (${name})`);

    /**
     * Delete the actions cache
     * @type {null}
     */

    cache = null;

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
        const actionRunner = makeHandler({
            handler,
            source: SOURCE_REMOTE,
            actionOptions: opts,
            ...(actions[name].input ? {input: actions[name].input} : {})
        });

        app[opts.route[0]].apply(app, [opts.route[1], ...middlewareList, actionRunner]);
    }
};

/**
 * Initialize the router
 * @param context
 */

exports.init = async context => {
    ctx = context;
    const config = context.get('config');

    app = context.get('app');
    plugins = context.get('plugins');
    build = context.get('build');

    if (app && get(config, 'actions.handler')) {
        app.post(config.actions.handler, handle);
    }

    if (app && get(config, 'actions.list')) {
        app.get(config.actions.list, list);
    }

    /**
     * Load core middleware
     */

    d('load (middlewares)');

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