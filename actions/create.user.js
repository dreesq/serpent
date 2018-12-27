const {config} = require('../index');
const {TOKEN_TYPE_CONFIRM, USER_STATUS_INACTIVE} = require('../constants');
const {makeToken, success} = require('../lib/utils');
const bcrypt = require('bcrypt');

config({
    name: 'createUser',
    input: {
        email: 'required|email|string',
        password: 'required|string',
        name: 'required|string'
    }
})(
    /**
     * Default login action
     * @param db
     * @param input
     * @param config
     * @param mail
     * @param i18n
     * @returns {Promise<void>}
     */

    async ({db, mail, config, input, i18n}) => {
        const {User, Token} = db;
        const confirm = config.get('plugins.auth.confirm');

        input.password = await bcrypt.hash(input.password, 10);
        input.locale = config.get('plugins.i18n.defaultLocale', 'en');

        confirm && (input.status = USER_STATUS_INACTIVE);

        const user = await User.create(input);

        if (confirm) {
            const token = await makeToken();

            await Token.create({
                userId: user._id,
                type: TOKEN_TYPE_CONFIRM,
                token
            });

            await mail({
                to: input.email,
                subject: i18n('emails.confirmAccount.subject'),
                text: token
            });
        }

        return success();
    }
);

