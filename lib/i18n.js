const path = require('path');
const {APP_PATH, MODULE_PATH} = require('../constants');
const {load, get, parseTemplate} = require('../utils');

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

    await load(APP_PATH, config.get('plugins.i18n.path', ''), (name, trans) => {
        const [lang, ext] = name.split('.');

        if (!translations[lang]) {
            translations[lang] = trans;
        }

        translations[lang] = {
            ...translations[lang],
            ...trans
        };
    });
};

/**
 * Action methods
 * @type {{t(*, *), translator(*): *}}
 */

exports.methods = {
    build(req) {
        const {lang} = req;
        const {translator} = this;
        const {translate} = translator(lang);

        return {
            translator,
            translate
        }
    },
    translate(key, data = {}, lang = defaultLocale) {
        let str = get(translations[lang], key);
        return str ? parseTemplate(str, data) : `[${key}]`;
    },
    translator(lang) {
        let trans = translations[lang];

        return {
            translate(key, data = {}) {
                let str = get(trans, key);
                return str ? parseTemplate(str, data) : `[${key}]`;
            }
        };
    }
};