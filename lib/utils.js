const crypto = require('crypto');
const {promisify} = require('util');
const fs = require('fs');
const path = require('path');
const {MODULE_PATH} = require('../constants');

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

exports.get = (obj, path, defaultValue = false) => {
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
 * Auto filter model helper
 * @param model
 * @param options
 * @returns {Function}
 */

exports.autoFilter = (model, options) => {
    return async ({input, db, user}) => {
        let collection = db[model];

        if (!collection) {
            return error();
        }

        const {filters = {}} = input;

        const page = filters.page || 1;
        delete filters.page;

        let query = collection.find(filters);

        if (options.restrictToUser) {
            query.where({userId: user._id});
        }

        const limit = options.limit || 5;
        limit !== -1 && ( query = query.limit(limit) );

        let count;
        const skip = (page - 1 || 0) * limit;

        if (options.pagination) {
            limit !== -1 && ( query = query.skip(skip) );
            count = collection.countDocuments();
        }

        let [data, total] = await Promise.all([query, count]);

        if (options.transform) {
            data = options.transform(data);
        }

        if (options.pagination) {
            return {
                data,
                pagination: {
                    page: limit === -1 ? 1 : page,
                    pages: limit === -1 ? 1 : Math.abs(total / limit),
                    hasMoreItems: limit === -1 ? false : ((skip + limit) < total)
                }
            }
        }

        return data;
    };
};