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

exports.register = (key, value) => {
     if (context.plugins[key]) {
          throw new Error(`Key ${key} is already set inside plugins context`);
     }

     context.plugins[key] = value.methods ? value.methods : value;
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
 * Loads all the plugins.
 *
 * @note: Config should be loaded first because it dictates
 * if other plugins should be loaded
 */

exports.init = () => {
     const plugins = [
          'config',
          'auth',
          'axios',
          'db',
          'logger',
          'socket',
          'mailer',
          'i18n',
          'input'
     ];

     for (const plugin of plugins) {
          const {config} = context.plugins;

          const Plugin = require(`./${plugin}`);
          const isEnabled = plugin => config && config.get ? config.get(`${plugin}.enabled`) : true;

          typeof Plugin.init === 'function' && isEnabled(plugin) && Plugin.init(context);
          exports.register(plugin, Plugin);
     }
};