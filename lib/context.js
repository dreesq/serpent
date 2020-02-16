const {PLUGINS_INIT} = require('../constants');
const {d} = require('../utils');

/**
 * Global application context
 * @type {{}}
 */

const context = {
    plugins: {},
    build: {},
    server: false,
    app: false,
    config: false
};

/**
 * Checks if plugin is enabled inside config
 * @param plugin
 * @returns {*}
 */

const isEnabled = plugin => {
    const {config} = context.plugins;

    const defaultEnabled = [
        'config',
        'logger',
        'crypto',
        'i18n',
        'events',
        'axios',
        'validator',
        'input',
        'utils'
    ];

    if (defaultEnabled.indexOf(plugin) > -1) {
        return true;
    }

    if (config && config.get) {
        return config.get(`plugins.${plugin}`, false);
    }

    return false;
};

/**
 * Registers a plugin
 * @param name
 * @param Plugin
 * @param customPlugin
 */

exports.registerPlugin = registerPlugin = async (name, Plugin, customPlugin = false) => {
    /**
     * Plugin is already registered
     * which means it could have been overwritten on application startup
     */

    if (context.plugins[name]) {
        d(`~ ow plugin (${name})`);
    }

    if (!isEnabled(name) && !customPlugin) {
        return;
    }

    d(`+ plugin (${name})`);

    if (typeof Plugin.init === 'function') {
        await Plugin.init(context);
    }

    if (typeof Plugin === 'function') {
        Plugin = await Plugin(context);
    }

    context.plugins[name] = {};
    context.plugins[name] = Plugin.methods ? Plugin.methods : Plugin;

    if (Plugin.build) {
        context.build[name] = Plugin.build;
    }
};

/**
 * Set context helper
 * @param key
 * @param value
 */

exports.set = (key, value) => {
    if (context[key]) {
        throw new Error(`Key ${key} already set inside context object.`);
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
        'logger',
        'db',
        'crypto',
        'firebase',
        'auth',
        'validator',
        'axios',
        'socket',
        'mail',
        'i18n',
        'input',
        'utils',
        'redis',
        'stripe',
        'es'
    ];

    for (const plugin of plugins) {
        const Plugin = require(`./${plugin}`);
        await registerPlugin(plugin, Plugin);
    }

    const {events} = context.plugins;
    events.emit(PLUGINS_INIT);
};
