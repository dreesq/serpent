const path = require('path');
const {APP_PATH, MODULE_PATH, DRIVER_DB, DRIVER_FILE} = require('../constants');
const {load, get, set, parseTemplate} = require('../utils');
const deepmerge = require('deepmerge');
const fs = require('fs');
const {promisify} = require('util');
const writeFile = promisify(fs.writeFile);

/**
 * Plugin containers
 * @type {boolean}
 */

let db = false;
let config = false;

/**
 * Default language
 * @type {boolean}
 */

let defaultLocale = false;
let driver = false;
let app = false;

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
    const {
        config: configPlugin,
        db: dbPlugin
    } = context.plugins;

    db = dbPlugin;
    config = configPlugin;

    /**
     * Set default language
     */

    defaultLocale = configPlugin.get('plugins.i18n.defaultLocale', 'en');
    driver = configPlugin.get('plugins.i18n.driver', 'file');
    app = configPlugin.get('name', 'app');

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

    if (driver === DRIVER_FILE) {
        const i18nPath = configPlugin.get('plugins.i18n.path', false);

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
    }

    if (driver === DRIVER_DB) {
        const allTranslations = await dbPlugin.Translation.find({
            app: {
                $in: [
                    null,
                    app
                ]
            }
        });

        for (const translation of allTranslations) {
            set(translations[translation.locale], translation.key, translation.content);
        }
    }
};

/**
 * Action methods
 */

exports.methods = methods = {
    getTranslations(lang) {
        return lang ? translations[lang] : translations;
    },
    async setTranslation(locale, key, content, app = null) {
        if (!locale || !key) {
            throw new Error('Missing `key` or `locale`.');
        }

        set(translations[locale], key, content);

        if (driver === DRIVER_FILE) {
            let filePath = path.join(APP_PATH, config.get('plugins.i18n.path', ''), `${locale}.json`);
            await writeFile(filePath, JSON.stringify(translations[locale], null, 4));
        }

        if (driver === DRIVER_DB) {
            await db.Translation.updateOne({
                key,
                locale,
                app
            }, {
                locale,
                key,
                app,
                content
            }, {
                upsert: true
            });
        }
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
