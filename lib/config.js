const {get: getItem} = require('./utils');
const path = require('path');
const fs = require('fs');

/**
 * Config storage
 * @type {{}}
 */

let config = {};

/**
 * Initializes the config plugin
 * @param context
 */

exports.init = context => {
     const appPath = path.dirname(require.main.filename);
     const appConfig = context.config;
     const env = process.env.NODE_ENV;

     /**
      * If autoload config, check for the config folder
      * and overwrite the default config with env config
      */

     if (getItem(appConfig, 'autoload.config', false)) {
          config = require(path.join(appPath, 'config/default.json'));

          const envPath = path.join(appPath, `config/${env}.json`);

          if (fs.existsSync(envPath)) {
               config = {...config, ...require(envPath)};
          }
     }

     /**
      * If a custom config file was specified, load the config
      * from custom path without env changes
      */

     if (getItem(appConfig, 'config', false)) {
          config = require(path.join(appPath, appConfig.config));
     }
};

/**
 * Gets a config item
 * @param key
 * @param fallback
 */

const get = (key, fallback = false) => {
     return getItem(config, key, fallback);
};

/**
 * Plugin exported methods
 * @type {{get: *}}
 */

exports.methods = {
     get
};