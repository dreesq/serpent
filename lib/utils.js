const {toQueryString} = require('../utils');

let config;

/**
 * Registered helpers
 * @type {{url(*, *=, *): string}}
 */

let helpers = {
    url(path, params = {}, locale) {
        return `${config.get('baseUrl', '')}${locale ? `/${locale}/` : '/'}${path}${toQueryString(params)}`;
    }
};

/**
 * Utilities plugin
 * @param context
 * @returns {Promise<void>}
 */

exports.init = async context => {
    const {config: configPlugin} = context.plugins;
    config = configPlugin;
};

/**
 * Exported methods
 * @type {{url()}}
 */

exports.methods = {
    register(name, handler) {
        return helpers[name] = handler;
    }
};

/**
 * Build on each request
 * @param req
 * @returns {{url, (*, *=, *): string}}
 */

exports.build = req => {
    return helpers;
};