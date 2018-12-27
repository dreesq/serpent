const path = require('path');
const fs = require('fs');
const {promisify} = require('util');
const {get: getValue} = require('./utils');

/**
 * Promisify functions
 */

const exists = promisify(fs.exists);

/**
 * Config storage
 * @type {{}}
 */

let config = {};

/**
 * Initializes the config plugin
 * @param context
 */

exports.init = async context => {
    const appPath = path.dirname(require.main.filename);
    const appConfig = context.config;
    const env = process.env.NODE_ENV;

    /**
     * If autoload config, check for the config folder
     * and overwrite the default config with env config
     */

    if (getValue(appConfig, 'autoload.config', false)) {
        config = require(path.join(appPath, 'config/default.json'));
        const envPath = path.join(appPath, `config/${env}.json`);

        if (await exists(envPath)) {
            config = {...config, ...require(envPath)};
        }
    }

    /**
     * If a custom config file was specified, load the config
     * from custom path without env changes
     */

    if (getValue(appConfig, 'config', false)) {
        config = require(path.join(appPath, appConfig.config));
    }
};

/**
 * Gets a config item
 * @param key
 * @param fallback
 */

const get = (key, fallback = false) => {
    return getValue(config, key, fallback);
};

/**
 * Plugin exported methods
 * @type {{get: *}}
 */

exports.methods = {
    get
};