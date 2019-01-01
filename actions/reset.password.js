const {config, getPlugins} = require('../index');
const {config: configPlugin} = getPlugins();
const {ACTION_REQUEST_RESET, ACTION_RESET, TOKEN_TYPE_RESET, RESET_TOKEN_EXPIRY} = require('../constants');
const {error, success, makeToken} = require('../utils');
const bcrypt = require('bcrypt');
const moment = require('moment');

config({
    name: 'resetUser',
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
     * @returns {Promise<void>}
     */
    async ({db, input, i18n, mail, utils}) => {
        const {User, Token} = db;

        /**
         * When requesting password reset
         */

        if (+input.action === ACTION_REQUEST_RESET) {
            const user = await User.findOne({email: input.email});

            if (!user) {
                return error(i18n.translate('errors.invalidEmail'));
            }

            const token = await makeToken();

            await Token.create({
                userId: user._id,
                type: TOKEN_TYPE_RESET,
                token
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

            return success();
        }

        /**
         * When requesting password update
         */

        if (input.action === ACTION_RESET) {
            const token = await Token.findOne({token: input.token, type: TOKEN_TYPE_RESET});

            if (!token) {
                return error(i18n.translate('errors.invalidToken'));
            }

            if (moment().diff(moment(token.createdAt), 'days') > RESET_TOKEN_EXPIRY) {
                return error(i18n.translate('errors.expiredToken'));
            }

            const user = await User.findOne({_id: token.userId});

            if (!user) {
                await token.remove();
                return error(i18n.translate('errors.invalidUser'));
            }

            user.password = await bcrypt.hash(input.password, 10);

            await user.save();
            await Token.deleteMany({userId: user._id, type: TOKEN_TYPE_RESET});

            return success();
        }
    }
);