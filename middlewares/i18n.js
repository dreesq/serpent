const {getPlugins} = require('../index');

/**
 * Middleware for setting request language
 * @param locales
 * @returns {Function}
 */

module.exports = locales => {
    const {i18n, config} = getPlugins();

    return (req, res, next) => {
        let lang = Object.keys(locales)[0];

        if (!lang) {
            lang = config.get('plugins.i18n.defaultLocale', 'en');
        }

        if (lang === 'user' && req.user) {
            lang = req.user.locale;
        }

        if (!lang && req.headers['Accept-Language']) {
            lang = req.headers['Accept-Language'];
        }

        req.translate = i18n.translator(lang).translate;
        req.lang = lang;
        next();
    };
};
