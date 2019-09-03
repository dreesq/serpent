const path = require('path');
const {APP_PATH, MODULE_PATH} = require('../constants');
const {load, get, set, parseTemplate} = require('../utils');
const deepmerge = require('deepmerge');

/**
 * Default language
 * @type {boolean}
 */

let defaultLocale = false;

/**
 * All translations
 * @type {{}}
 */

const translations = {};

/**
 * On plugin load,
 * cache all translations
 */

exports.init = async context => {
    const {config} = context.plugins;

    /**
     * Set default language
     */

    defaultLocale = config.get('plugins.i18n.defaultLocale', 'en');

    /**
     * Load core translations
     */

    await load(MODULE_PATH, 'res/locales', (name, trans) => {
        const [lang, ext] = name.split('.');
        translations[lang] = trans;
    });

    /**
     * Overwrite them with
     * user defined translations
     */

    const i18nPath = config.get('plugins.i18n.path', false);

    if (!i18nPath) {
        return;
    }

    await load(APP_PATH, i18nPath, (name, trans) => {
        const [lang, ext] = name.split('.');

        if (!translations[lang]) {
            translations[lang] = trans;
        }

        translations[lang] = deepmerge(translations[lang], trans);
    });
};

/**
 * Action methods
 */

exports.methods = methods = {
    getTranslations(lang) {
        return lang ? translations[lang] : translations;
    },
    setTranslation(locale, key, value) {
        set(translations[locale], key, value);
    },
    translate(key, data = {}, lang = defaultLocale) {
        let str = get(translations[lang], key);
        return str ? parseTemplate(str, data) : `[${key}]`;
    },
    translator(lang) {
        return {
            translate(key, data = {}) {
                let str = get(translations[lang], key);
                return str ? parseTemplate(str, data) : `[${key}]`;
            }
        };
    }
};

/**
 * Run on each request
 * @param req
 * @returns {{translator: *, translate: *}}
 */

exports.build = req => {
    const {lang} = req;
    const {translator} = methods;
    const {translate} = translator(lang);

    return {
        translator,
        translate,
        getTranslations(lang) {
            return lang ? translations[lang] : translations;
        }
    }
};
