const {config, getPlugins} = require('../index');
const {error, success} = require('../utils');
const {config: configPlugin} = getPlugins();
const {
    USER_STATUS_ACTIVE,
    TOKEN_TYPE_CONFIRM
} = require('../constants');

config({
    name: 'confirmUser',
    input: {
        token: 'required|string|min:64'
    },
    enabled: configPlugin.get('plugins.auth.confirm')
})(
    /**
     * Confirm user account
     * @param db
     * @param input
     * @param t
     * @param crypto
     * @returns {Promise<void>}
     */

    async ({db, input, t, crypto}) => {
        const {User, Token} = db;

        const token = await Token.findOne({
            token: await crypto.hash(input.token),
            type: TOKEN_TYPE_CONFIRM
        });

        if (!token) {
            return error(t('errors.invalidToken'));
        }

        await User.updateOne({_id: token.userId}, {
            status: USER_STATUS_ACTIVE
        });

        await token.remove();
        return success(t('messages.userConfirmed'));
    }
);
