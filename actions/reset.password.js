const {config, getPlugins} = require('../index');
const {config: configPlugin} = getPlugins();
const {error, success, makeToken, hash, hookRunner} = require('../utils');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const {
    ACTION_REQUEST,
    ACTION_HANDLE,
    TOKEN_TYPE_RESET,
    RESET_TOKEN_EXPIRY,
    TOKEN_TYPE_REFRESH
} = require('../constants');

config({
    name: 'resetPassword',
    input: {
        action: 'required|number',
        email: 'email|when:action,0',
        token: 'when:action,1|min:64',
        password: 'when:action,1|min:10'
    },
    enabled: configPlugin.get('plugins.auth.reset')
})(
    /**
     * Confirm user account
     * @param db
     * @param input
     * @param i18n
     * @param mail
     * @param config
     * @param utils
     * @param options
     * @returns {Promise<void>}
     */

    async ({db, input, i18n, config, mail, utils, options}) => {
        const {User, Token} = db;
        const runner = hookRunner(options);

        /**
         * When requesting password reset
         */

        if (+input.action === ACTION_REQUEST) {
            const user = await User.findOne({email: input.email});
            runner('before', user, input);

            if (!user) {
                return error(i18n.translate('errors.invalidEmail'));
            }

            const token = await makeToken();

            await Token.create({
                userId: user._id,
                type: TOKEN_TYPE_RESET,
                token: hash(token)
            });

            const t = i18n.translator(user.locale).translate;

            await mail({
                to: input.email,
                subject: t('emails.resetAccount.subject'),
                html: t('emails.resetAccount.html', {
                    url: utils.url('reset', {token}),
                    user
                })
            });

            runner('after', user, input);
            return success(t('messages.resetRequested'));
        }

        /**
         * When requesting password update
         */

        if (+input.action === ACTION_HANDLE) {
            const token = await Token.findOne({
                token: hash(input.token),
                type: TOKEN_TYPE_RESET
            });

            if (!token) {
                return error(i18n.translate('errors.invalidToken'));
            }

            const diff = moment().diff(moment(token.createdAt), 'days');

            if (diff > RESET_TOKEN_EXPIRY) {
                return error(i18n.translate('errors.expiredToken'));
            }

            const user = await User.findOne({_id: token.userId});
            runner('before', user, input);
            const t = i18n.translator(user.locale).translate;

            if (!user) {
                await token.remove();
                return error(t('errors.invalidUser'));
            }

            user.password = await bcrypt.hash(input.password, 10);
            user.ts = moment().unix();

            await user.save();
            await Token.deleteMany({
                userId: user._id,
                type: {
                    $in: [
                        TOKEN_TYPE_RESET,
                        TOKEN_TYPE_REFRESH
                    ]
                }
            });

            if (config.get('plugins.auth.notify')) {
                await mail({
                    to: input.email,
                    subject: t('emails.accountReset.subject'),
                    html: t('emails.accountReset.html', {
                        user
                    })
                });
            }

            runner('after', user, input);
            return success(t('messages.resetDone'));
        }
    }
);