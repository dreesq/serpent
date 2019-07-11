const {Client} = require('@elastic/elasticsearch');

/**
 * Elastic search object
 * @type {boolean}
 */

let client = false;

/**
 * Plugin initialization
 * @param context
 */

exports.init = async context => {
    const {config} = context.plugins;
    client = new Client(config.get('plugins.es'));
};

/**
 * Export the client
 * @type {boolean}
 */

exports.build = req => {
    return client;
};