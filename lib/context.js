const {PLUGINS_INIT} = require('../constants');
const {d} = require('../utils');

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

exports.registerPlugin = registerPlugin = async (name, Plugin) => {

    /**
     * Plugin is already registered
     * which means it could have been overwritten on application startup
     */

    if (context.plugins[name]) {
        console.warn(`Overwriting core plugin '${name}'.`);
    }

    const {config} = context.plugins;

    /**
     * Checks if plugin is enabled inside config
     * @param plugin
     * @returns {*}
     */

    const isEnabled = plugin => {
        if (['i18n', 'config', 'events', 'axios', 'validator', 'input', 'utils'].indexOf(plugin) > -1) {
            return true;
        }

        if (config && config.get) {
            return config.get(`plugins.${plugin}`, false);
        }

        return false;
    };

    if (!isEnabled(name)) {
        return;
    }

    if (typeof Plugin.init === 'function') {
        await Plugin.init(context);
    }

    if (typeof Plugin === 'function') {
        Plugin = await Plugin(context);
    }

    d('Registering plugin with name', name);
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
        'firebase',
        'db',
        'auth',
        'validator',
        'axios',
        'logger',
        'socket',
        'mail',
        'i18n',
        'input',
        'utils',
        'redis',
        'stripe'
    ];

    for (const plugin of plugins) {
        const Plugin = require(`./${plugin}`);
        await registerPlugin(plugin, Plugin);
    }

    const {events} = context.plugins;
    events.emit(PLUGINS_INIT);
};