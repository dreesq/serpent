const {config, getPlugins} = require('../index');
const {USER_STATUS_ACTIVE} = require('../constants');
const {error, success} = require('../lib/utils');
const {config: configPlugin} = getPlugins();

config({
    name: 'confirmUser',
    input: {
        token: 'required|string|min:64'
    },
    enabled: configPlugin.get('plugins.auth.confirm')
})(
    /**
     * Confirm user account
     * @returns {Promise<void>}
     */
    async ({db, input, i18n}) => {
        const {User, Token} = db;

        const token = await Token.findOne({token: input.token});

        if (!token) {
            return error(i18n('errors.invalidToken'));
        }

        await User.updateOne({_id: token.userId}, {status: USER_STATUS_ACTIVE});
        await token.remove();
        return success();
    }
);