const {config, getPlugins} = require('../index');
const {config: configPlugin} = getPlugins();
const {success, get} = require('../utils');

/**
 * Checks if translations list requested by client
 * is returnable
 *
 * @param value
 * @returns {string}
 */

const listValidator = value => {
    if (!Array.isArray(value)) {
        return 'validation.array';
    }

    let allowed = configPlugin.get('plugins.i18n.serveTranslations');

    for (let entry of value) {
        if (!allowed.includes(entry)) {
            return 'validation.array';
        }
    }
};

config({
    name: 'getTranslations',
    input: {
        locale: 'required|string',
        list: listValidator
    },
    enabled: configPlugin.get('plugins.i18n.serveTranslations')
})(
    /**
     * Returns the list of translations,
     * based on requested language and list
     * of translations
     *
     * @param input
     * @param i18n
     * @returns {Promise<{success}>}
     */

    async ({input, i18n}) => {
        const {locale, list} = input;
        const translations = i18n.getTranslations(locale);

        let data = {};

        for (let item of list) {
            data[item] = get(translations, item, '');
        }

        return success(data);
    }
);