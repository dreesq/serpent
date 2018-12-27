const {config} = require('../index');
const {ACTION_REQUEST_RESET, ACTION_RESET, TOKEN_TYPE_RESET} = require('../constants');
const {error, success, makeToken} = require('../lib/utils');
const bcrypt = require('bcrypt');

config({
    name: 'resetUser',
    input: {
        action: 'required|number',
        email: 'email|when:action,0',
        token: 'when:action,1',
        password: 'when:action,1|min:10'
    }
})(
    /**
     * Confirm user account
     * @returns {Promise<void>}
     */
    async ({db, input, i18n, mail}) => {
        const {User, Token} = db;

        /**
         * When requesting password reset
         */

        if (input.action === ACTION_REQUEST_RESET) {
            const user = await User.findOne({email: input.email});

            if (!user) {
                return error(i18n('errors.invalidEmail'));
            }

            const token = await makeToken();

            await Token.create({
                userId: user._id,
                type: TOKEN_TYPE_RESET,
                token
            });

            await mail({
                to: input.email,
                subject: i18n('emails.resetAccount.subject'),
                text: token
            });

            return success();
        }

        /**
         * When requesting password update
         */

        if (input.action === ACTION_RESET) {
            const token = await Token.findOne({token: input.token, type: TOKEN_TYPE_RESET});

            if (!token) {
                return error(i18n('errors.invalidToken'));
            }

            const user = await User.findOne({_id: token.userId});

            if (!user) {
                await token.remove();
                return error(i18n('errors.invalidUser'));
            }

            user.password = await bcrypt.hash(input.password, 10);

            await user.save();
            await token.remove();

            return success();
        }
    }
);