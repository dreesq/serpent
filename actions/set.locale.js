const {config, getPlugins} = require('../index');
const {success} = require('../utils');
const {config: configPlugin} = getPlugins();

config({
    name: 'setLocale',
    input: {
        async locale(value) {
            const locales = configPlugin.get('plugins.i18n.locales', []);

            if (!value) {
                return;
            }

            if (locales.indexOf(value) === -1) {
                return 'validation.invalidLocale'
            }
        }
    },
    middleware: [
        'auth:required'
    ],
    enabled: configPlugin.get('plugins.auth.update') && configPlugin.get('plugins.i18n')
})(
/**
     * Changes user's locale
     * @param db
     * @param user
     * @param mail
     * @returns {Promise<void>}
     */

    async ({db, user, input}) => {
        const {User} = db;
        const {locale} = input;

        await User.updateOne({_id: user._id}, {
            locale
        });

        return success();
    }
);
