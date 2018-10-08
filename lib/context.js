/**
 * Global application context
 * @type {{}}
 */

const context = {
     plugins: {},
     app: false,
     config: false
};

/**
 * Registers a plugin
 * @param key
 * @param value
 */

const register = (key, value) => {
     if (context.plugins[key]) {
          throw new Error(`Key ${key} is already set inside context`);
     }

     context.plugins[key] = value;
};

/**
 * Set context helper
 * @param key
 * @param value
 */

exports.set = (key, value) => {
     if (context[key]) {
          throw new Error(`Key ${key} is already set inside context`);
     }

     context[key] = value;
};

/**
 * Get context helper
 * @param key
 * @returns {*}
 */

exports.get = key => {
     return context[key];
};

/**
 * Load all the plugins
 */

exports.init = () => {
     const plugins = [
          'auth',
          'config',
          'axios',
          'db',
          'logger',
          'socket'
     ];

     for (const plugin of plugins) {
          const Plugin = require(`./${plugin}`);
          typeof Plugin.init === 'function' && Plugin.init(context);
          register(plugin, Plugin);
     }
};