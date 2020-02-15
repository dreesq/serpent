const {toQueryString} = require('../utils');
const {GATEWAY_LOG} = require('../constants');

let config;
let events;

/**
 * Registered helpers
 * @type {{url(*, *=, *): string}}
 */

let helpers = {
    url(path, params = {}, locale) {
        return `${config.get('baseUrl', '')}${locale ? `/${locale}/` : '/'}${path}${toQueryString(params)}`;
    },
    logGateway(...args) {
        events.emit(GATEWAY_LOG, args);
    }
};

/**
 * Utilities plugin
 * @param context
 * @returns {Promise<void>}
 */

exports.init = async context => {
    const {config: configPlugin, events: eventsPlugin} = context.plugins;
    config = configPlugin;
    events = eventsPlugin;
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
