const {config} = require('../index');
const {USER_STATUS_ACTIVE} = require('../constants');
const {error, success} = require('../lib/utils');

config({
    name: 'confirmUser',
    input: {
        token: 'required|string|min:32'
    }
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