const {config, getPlugins} = require('../index');
const {config: configPlugin} = getPlugins();
const {success} = require('../utils');

config({
    name: 'getTranslations',
    input: {
        locale: 'required|string',
        list(value) {
            if (!Array.isArray(value)) {
                return 'validation.array';
            }

            let allowed = configPlugin.get('plugins.i18n.serveTranslations');

            for (let entry of value) {
                if (!allowed.includes(entry)) {
                    return 'validation.array';
                }
            }
        }
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
            data[item] = translations[item];
        }

        return success(data);
    }
);