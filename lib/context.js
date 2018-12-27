const {PLUGINS_INIT} = require('../constants');

/**
 * Global application context
 * @type {{}}
 */

const context = {
     plugins: {},
     server: false,
     app: false,
     config: false
};

/**
 * Registers a plugin
 * @param name
 * @param Plugin
 */

exports.register = register = async (name, Plugin) => {

     /**
      * Plugin is already registered
      * which means it could have been overwritten on application startup
      */

     if (context.plugins[name]) {
          return;
     }

     const {config} = context.plugins;
     const isEnabled = plugin => (config && config.get) ? config.get(`plugins.${plugin}.enabled`, true) : true;

     typeof Plugin.init === 'function' && isEnabled(name) && await Plugin.init(context);
     typeof Plugin === 'function' ? (Plugin = await Plugin(context)) : null;

     context.plugins[name] = Plugin.methods ? Plugin.methods : Plugin;
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

exports.init = async () => {
     const plugins = [
          'events',
          'config',
          'db',
          'auth',
          'validator',
          'axios',
          'logger',
          'socket',
          'mail',
          'i18n',
          'input'
     ];

     for (const plugin of plugins) {
          const Plugin = require(`./${plugin}`);
          await register(plugin, Plugin);
     }

     const {events} = context.plugins;
     events.emit(PLUGINS_INIT);
};