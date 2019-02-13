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

exports.select = select = (obj = {}, fields = []) => {
    if (fields === null) {
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
    return await crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
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
        res.errors = data;
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
    const entities = await readdir(`${appPath}/${type}`);
    d('Loading', type, 'path', appPath, 'requireFile', requireFile);

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

    if (!config || !config.get || !config.get('debug', false)) {
        return;
    }

    return console.log.apply(this, ['(serpent)', ...args]);
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
        name: `Auto${model}`,
        select: null,
        middleware: [],
        type: 'actions',
        allowNull: false,
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
            name: `${method}${name}`,
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
                    fields
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

        config({
            ...nameMethod(method),
            middleware: options.middleware
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

exports.autoFilter = autoFilter = (model, options) => {
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

        if (options.after) {
            data = options.after(data);
        }

        if (options.pagination) {
            return {
                data,
                pagination: {
                    page: limit === -1 ? 1 : page,
                    pages: limit === -1 ? 1 : Math.ceil(total / limit),
                    hasMoreItems: limit === -1 ? false : ((skip + limit) < total)
                }
            }
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
        return get(data, $1.trim(), `[${$1.trim()}]`);
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
 * Sha256 hash helper
 * @param text
 */

exports.hash = (text = '') => {
    return crypto.createHash('sha256').update(text).digest('hex');
};