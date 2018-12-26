const path = require('path');
const {load} = require('./utils');

/**
 * All translations
 * @type {{}}
 */

const translations = {};

/**
 * Parse string helper
 * @param string
 * @param data
 * @returns {Object|void|*}
 */

const parse = (string, data) => {
    return string.replace(/{{\s*([^}]*)\s*}}/g, (match, $1) => {
        return data[$1.trim()];
    });
};

/**
 * On plugin load,
 * cache all translations
 */

exports.init = async context => {
    const {config} = context.plugins;

    /**
     * Load core translations
     */

    await load('.', 'res/locales', (name, trans) => {
        const [lang, ext] = name.split('.');
        translations[lang] = trans;
    });


    /**
     * Overwrite them with
     * user defined translations
     */

    const appPath = path.dirname(require.main.filename);
    await load(appPath, config.get('plugins.i18n.path', ''), (name, trans) => {
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
    translate(lang, key, data = {}) {
        let str = translations[lang][key];
        return str ? parse(str, data) : `[${key}]`;
    },
    translator(lang) {
        let trans = translations[lang];

        return {
            translate(key, data) {
                let str = trans[key];
                return str ? parse(str, data) : `[${key}]`;
            }
        };
    }
};