const {config, getPlugins} = require('../index');
const {USER_STATUS_ACTIVE} = require('../constants');
const {error, success, hash} = require('../utils');
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
        const t = i18n.translate;

        const token = await Token.findOne({token: hash(input.token)});

        if (!token) {
            return error(t('errors.invalidToken'));
        }

        await User.updateOne({_id: token.userId}, {status: USER_STATUS_ACTIVE});
        await token.remove();
        return success();
    }
);