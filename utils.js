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

exports.error = (data = '') => {
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

exports.success = (data = '') => {
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
        middleware: [],
        type: 'actions',
        after(action, data, ctx) {
            return data;
        },
        before(ctx) {

        }
    };

    options = {
        ...defaults,
        ...options
    };

    /**
     * Name the method
     * @param name
     * @param method
     * @param type
     * @param path
     * @param visible
     * @returns {*}
     */

    const nameMethod = (name, method, type = 'action', path = '', visible = true) => {
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
                route: {
                    method: methods[method],
                    path: toRoutePath(method)
                }
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
     * @param before
     * @param after
     * @returns {Function}
     */

    const defineMethod = (model, method, before, after) => {
        return async ctx => {
            const {db, req} = ctx;
            const collection = db[model];

            if (!collection) {
                return error();
            }

            let data = false;

            let filters = {
                _id: get(req.body, 'id', req.params.id)
            };

            if (typeof before === 'function') {
                filters = await before(ctx, method, filters);
            }

            if (method === 'get') {
                data = await collection.findOne(filters);
                data = data || {};
            }

            if (method === 'find') {
                data = await autoFilter(model, {
                    filters: (() => filters),
                    pagination: true
                })(ctx);
            }

            if (method === 'create') {
                data = await collection.create(req.body);
            }

            if (method === 'remove') {
                await collection.deleteMany(filters);
                data = {
                    success: true
                };
            }

            if (method === 'update') {
                await collection.updateMany(filters, {
                    $set: req.body
                });

                const updated = await collection.find(filters);
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
            ...nameMethod(options.name, method, options.type, options.path, options.visible),
            middleware: options.middleware
        })(
            defineMethod(model, method, options.before, options.after)
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
    return async ({input, db, user}) => {
        let collection = db[model];

        if (!collection) {
            return error();
        }

        const {filters = {}} = input;
        const page = filters.page || 1;

        delete filters.page;
        let query = collection.find();

        if (options.filters) {
            options.filters(query, filters, {db, user, input});
        }

        if (options.restrictToUser) {
            query.where({userId: user._id});
        }

        const limit = options.limit || 5;
        limit !== -1 && query.limit(limit);

        let count;
        const skip = (page - 1 || 0) * limit;

        if (options.pagination) {
            limit !== -1 && query.skip(skip);
            count = collection.countDocuments();
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