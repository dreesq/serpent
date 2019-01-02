const {config, getPlugins} = require('../index');
const {TOKEN_TYPE_CONFIRM, USER_STATUS_INACTIVE} = require('../constants');
const {makeToken, success, hash} = require('../utils');
const {config: configPlugin} = getPlugins();
const bcrypt = require('bcrypt');

config({
    name: 'createUser',
    input: {
        email: 'required|email|string|unique:user,email',
        password: 'required|string|min:10',
        name: 'required|string',
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
    enabled: configPlugin.get('plugins.auth')
})(
    /**
     * Default login action
     * @param db
     * @param input
     * @param config
     * @param mail
     * @param i18n
     * @param utils
     * @returns {Promise<void>}
     */

    async ({db, mail, config, input, i18n, utils}) => {
        const {User, Token} = db;
        const confirm = config.get('plugins.auth.confirm');

        input.password = await bcrypt.hash(input.password, 10);

        if (!input.locale) {
            input.locale = config.get('plugins.i18n.defaultLocale', 'en');
        }

        confirm && (input.status = USER_STATUS_INACTIVE);

        const user = await User.create(input);

        if (confirm) {
            const token = await makeToken();

            await Token.create({
                userId: user._id,
                type: TOKEN_TYPE_CONFIRM,
                token: hash(token)
            });

            const t = i18n.translator(user.locale).translate;

            await mail({
                to: input.email,
                subject: t('emails.confirmAccount.subject'),
                html: t('emails.confirmAccount.html', {
                    user: user.toObject(),
                    url: utils.url('confirm', {token})
                })
            });
        }

        return success();
    }
);
