const crypto = require('crypto');
const {promisify} = require('util');
const fs = require('fs');
const path = require('path');
const {MODULE_PATH} = require('./constants');
const serpent = require('./');

/**
 * Promisify functions
 */

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

/**
 * Helper for getting object value by path
 * @param obj
 * @param path
 * @param defaultValue
 */

exports.get = get = (obj, path, defaultValue = false) => {
    let value = path.split('.').reduce((current, key) => (current && current.hasOwnProperty(key) ? current[key] : undefined), obj);
    return (typeof value !== 'undefined' ? value : defaultValue);
};

/**
 * Given an object, return selected fields
 * @param obj
 * @param fields
 */

exports.select = select = (obj = {}, fields) => {
    if (!Array.isArray(fields)) {
        return obj;
    }

    let actions = {};

    for (let key of fields) {
        let remove = key[0] === '-';

        if (remove) {
            key = key.substr(1, key.length);
            actions[key] = -1;
        }

        if (!remove) {
            actions[key] = 1;
        }
    }

    for (let key in obj) {
        if (actions[key] === 1) {
            continue;
        }

        delete obj[key];
    }

    return obj;
};

/**
 * Remove keys utility
 * @param obj
 * @param args
 * @returns object
 */

exports.removeKeys = (obj, args = []) => {
    let copied = {...obj};

    for (let arg of args) {
        delete copied[arg];
    }

    return copied;
};

/**
 * Helper for creating tokens
 * @param length
 * @returns {Promise<*>}
 */

exports.makeToken = async (length = 64) => {
    const crypto = serpent.plugin('crypto');
    return await crypto.random(length);
};

/**
 * Error helper
 * @param data
 * @returns {{errors: {message: string[]}}}
 */

exports.error = error = (data = '') => {
    let res = {
        errors: {
            message: [data]
        }
    };

    if (typeof data === 'object') {
        if (data.message) {
            res.errors.message[0] = data.message;
        } else {
            res.errors = data;
        }

        if (data.debug) {
            res.debug = data.debug;
        }
    }

    return res;
};

/**
 * Success helper
 * @param data
 */

exports.success = success = (data = '') => {
    if (!data) {
        return {
            success: true
        };
    }

    return Array.isArray(data) ? {data} : data;
};

/**
 * Helper function for loading folder
 * @param appPath
 * @param type
 * @param callback
 * @param requireFile
 * @returns {Promise<void>}
 */

exports.load = async (appPath = MODULE_PATH, type = 'actions', callback = false, requireFile = true) => {
    let entities = [];
    let logger = serpent.plugin('logger');
    d(`load (${type}) <- (${appPath})`);

    try {
        entities = await readdir(`${appPath}/${type}`);
    } catch(e) {
        logger.error(`Failed to read path (${appPath}/${type}), error:`, e);
    }

    for (const entity of entities) {
        let entityPath = path.join(appPath, type, entity);
        let itemStat = await stat(entityPath);

        if (!itemStat.isFile()) {
            continue;
        }

        let required;

        if (requireFile) {
            required = require(entityPath);
        } else  {
            required = entityPath;
        }

        if (callback) {
            callback(entity, required);
        }
    }
};

/**
 * Debug helper
 * @param args
 */

exports.d = d = (...args) => {
    const config = serpent.plugin('config', false);
    const logger = serpent.plugin('logger', console);

    if (!config || !config.get || !config.get('debug', false)) {
        return;
    }

    args.unshift('(s)');
    return logger.debug(args.join(' '));
};

/**
 * Auto generate crud methods
 * @param model
 * @param options
 */

exports.autoCrud = (model, options = {}) => {
    const methods = [
        'create',
        'remove',
        'update',
        'get',
        'find'
    ];

    const defaults = {
        methods,
        name: model,
        select: null,
        middleware: [],
        schema: {},
        type: 'actions',
        allowNull: false,
        restrictToUser: false,
        after(ctx, method, data) {
            return data;
        },
        before(ctx, method, filters) {
            return filters;
        }
    };

    options = {
        ...defaults,
        ...options
    };

    const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

    /**
     * Name the method
     * @param method
     * @returns {*}
     */

    const nameMethod = method => {
        const {name, type = 'action', path = '', visible = true} = options;

        if (type === 'rest') {
            const methods = {
                create: 'post',
                update: 'put',
                remove: 'delete',
                find: 'get',
                get: 'get'
            };

            const toRoutePath = (method) => {
                return {
                    'create': `${path}`,
                    'update': `${path}/:id`,
                    'remove': `${path}/:id`,
                    'find': `${path}`,
                    'get': `${path}/:id`
                }[method];
            };

            return {
                route: [methods[method], toRoutePath(method)]
            }
        }

        return {
            name: `auto${capitalize(method)}${name}`,
            visible
        };
    };

    /**
     * Define the method
     * @param model
     * @param method
     * @returns {Function}
     */

    const defineMethod = (model, method) => {
        return async ctx => {
            const {db, input} = ctx;
            const collection = db[model];
            const {before, after} = options;

            if (!collection) {
                return error(`Could not find the given collection.`);
            }

            let data = false;
            let filters = {};

            let fields = Array.isArray(options.fields) ? options.fields.join(' ') : null;

            if (['update', 'remove', 'get'].includes(method)) {
                let id = input.id;

                if (id) {
                    filters._id = id;
                }

                if (options.restrictToUser) {
                    filters.userId = ctx.user._id;
                }

                if (!id && !options.allowNull) {
                    return error(`Method does not support null filtering.`);
                }
            }

            if (typeof before === 'function') {
                filters = await before(ctx, method, filters);
            }

            if (method === 'get') {
                data = await collection.findOne(filters, fields);
                data = data || {};
            }

            if (method === 'find') {
                const opts = {
                    pagination: true,
                    fields,
                    restrictToUser: options.restrictToUser
                };

                if (typeof filters === 'function') {
                    opts.before = filters;
                }

                data = await autoFilter(model, opts)(ctx);
            }

            if (method === 'create') {
                delete input._id;
                data = await collection.create(input);
                data = select(data._doc, options.fields);
            }

            if (method === 'remove') {
                await collection.deleteMany(filters);
                data = {
                    success: true
                };
            }

            if (method === 'update') {
                delete input._id;
                await collection.updateMany(filters, {
                    $set: input
                });

                const updated = await collection.find(filters, fields);
                data = updated.length === 1 ? updated[0] : updated;
            }

            if (typeof after === 'function') {
                return await after(ctx, method, data);
            }

            return data;
        };
    };

    for (const method of options.methods) {
        if (!methods.includes(method)) {
            throw new Error(`Invalid method ${method}.`);
        }

        const input = {};

        if (['create', 'update'].includes(method)) {
            input.input = {...options.schema};
        }

        if (method === 'update') {
            input.input.id = 'required|string|min:24'
        }

        config({
            ...nameMethod(method),
            middleware: options.middleware,
            ...input
        })(
            defineMethod(model, method)
        );
    }
};


/**
 * Auto filter model helper
 * @param model
 * @param options
 * @returns {Function}
 */

exports.autoFilter = autoFilter = (model, options = {}) => {
    return async ctx => {
        const {input, db, user} = ctx;
        let collection = db[model];

        if (!collection) {
            return error(`Could not find the given collection.`);
        }

        const {filters = {}, sorts = {}, page = 1} = input;

        let makeQuery = () => {
            let query = collection.find();

            if (options.before) {
                options.before(query, filters, ctx);
            }

            if (options.restrictToUser) {
                query.where({userId: user._id});
            }

            if (options.fields) {
                query.select(options.fields);
            }

            return query;
        };

        let query = makeQuery();

        if (Object.keys(sorts).length) {
            query.sort(sorts);
        } else {
            query.sort({
                _id: -1
            });
        }

        const limit = options.limit || 5;
        limit !== -1 && query.limit(limit);

        let count;
        const skip = (page - 1 || 0) * limit;

        if (options.pagination) {
            limit !== -1 && query.skip(skip);
            count = makeQuery().countDocuments();
        }

        let [data, total] = await Promise.all([query, count]);

        if (options.pagination) {
            data = {
                data,
                pagination: {
                    page: limit === -1 ? 1 : page,
                    pages: limit === -1 ? 1 : Math.ceil(total / limit),
                    hasMoreItems: limit === -1 ? false : ((skip + limit) < total)
                }
            }
        }

        if (options.after) {
            data = options.after(data);
        }

        return data;
    };
};

/**
 * Parse template helper
 * @param string
 * @param data
 * @returns {Object|void|*}
 */

exports.parseTemplate = (string, data = {}) => {
    return string.replace(/{{\s*([^}]*)\s*}}/g, (match, $1) => {
        let key = $1.trim();

        /**
         * Handle pluralization
         */

        if (key.indexOf(':') > -1) {
            let [newKey, options] = key.split(':');
            let value = +get(data, newKey, `[${newKey}]`);

            options = options.split('|');
            let index = value === 0 ? 0 : (value === 1 ? 1 : (value > 1 ? 2 : false));

            if (!isNaN(index)) {
                let result = options[index];
                return result.indexOf('_') > -1  ? result.replace(/_/g, value) : result[index];
            }
        }

        return get(data, key, `[${key}]`);
    });
};

/**
 * Query string helper
 * @param obj
 * @returns {string}
 */

exports.toQueryString = (obj = {}) => {
    let result = Object.keys(obj).map(key => key + '=' + encodeURIComponent(obj[key])).join('&');
    return result.length ? `?${result}` : '';
};

/**
 * Capitalizes given text
 * @param text
 * @returns {string}
 */

exports.capitalize = capitalize = (text = '') => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/**
 * Dotted to capitalized name
 * @param model
 * @returns {string}
 */

exports.toModelName = (model = '') => {
    return model.split('.').map(part => capitalize(part)).join('')
};


/**
 * Stripe hook utility
 * @param options
 * @returns {Promise<void>}
 */

exports.stripeHook = ({onSubscribe, onUnsubscribe, onEvent, onRefund}) => {
    const {stripe, config} = serpent.getPlugins();
    const whKey = config.get('plugins.stripe.whKey');

    return async ctx => {
        const {req, res} = ctx;
        const {client} = stripe.build(req);
        const sig = req.headers['stripe-signature'];

        let event;

        try {
            event = client.webhooks.constructEvent(req.rawBody, sig, whKey);
        } catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        const type = event.type;
        const data = event.data.object;

        onEvent && await onEvent(type, data, ctx);

        if (type === 'charge.refunded') {
            onRefund && await onRefund(data, ctx);
        }

        if (type === 'customer.subscription.created') {
            onSubscribe && await onSubscribe(data, ctx);
        }

        if (type === 'customer.subscription.deleted') {
            onUnsubscribe && await onUnsubscribe(data, ctx);
        }

        res.end();
    };
};

/**
 * Generates a form structure for client side auto generation
 * @param type
 * @param label
 * @param placeholder
 * @param values
 * @returns {Buffer | Buffer}
 */

exports.encodeField = encodeField = ({type = 'text', label = '', placeholder = '', values = ''}) => {
    let data = [type, label, placeholder, values];
    let result = new Buffer(JSON.stringify(data)).toString('base64');

    return `form:${result}`;
};

/**
 * Generates a hook runner based on given options
 * @param options
 * @returns {Function}
 */

exports.hookRunner = (options = {}) => {
    return (hook, ...args) => {
        if (!options.hooks)
            return;

        if (typeof options.hooks[hook] === 'function')
            return options.hooks[hook](...args);
    }
};

/**
 * Given a string escapes it
 * @param text
 */

exports.escape = (text = '') => {
    let map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, match => map[match]);
};

/**
 * Given an input and a form structure, maps its data to form base64
 * @param form
 */

exports.form = (form = {}) => {
    let result = {};

    main: for (const key in form) {
        for (const subKey in form[key]) {
            if (typeof form[key][subKey] === 'object' && !Array.isArray(form[key][subKey])) {
                console.warn(`Form does not support nested definitions. ${subKey} discarded from form definition`);
                continue main;
            }
        }


        const {validation = false, ...others} = form[key];
        result[key] = `${encodeField(others)}|${validation}`;
    }

    return result;
};
