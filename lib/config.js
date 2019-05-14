const path = require('path');
const fs = require('fs');
const {promisify} = require('util');
const {get: getValue} = require('../utils');
const deepmerge = require('deepmerge');

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
     * If auto load config, check for the config folder
     * and overwrite the default config with env config
     */

    let configPath = getValue(appConfig, 'autoload.config', false);
    configPath = configPath === true ? 'config' : configPath;

    if (configPath) {
        let buildConfig = require(path.join(appPath, 'config/default'));
        let envConfigPath = path.join(appPath, `config/${env}.js`);

        config = await buildConfig();

        if (await exists(envConfigPath)) {
            let buildEnvConfig = require(envConfigPath);
            config = deepmerge(config, await buildEnvConfig());
        }
    }

    /**
     * If a custom config file was specified, load the config
     * from custom path without env changes
     */

    if (getValue(appConfig,  'config', false)) {
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