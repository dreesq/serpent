const {config, getPlugins} = require('../index');
const {TOKEN_TYPE_REFRESH} = require('../constants');
const {error, success, makeToken} = require('../lib/utils');
const {config: configPlugin} = getPlugins();

config({
    name: 'refreshToken',
    input: {
        token: 'required|string|min:128'
    },
    enabled: configPlugin.get('plugins.auth.refresh')
})(
    /**
     * Returns a new jwt token on use
     * @param db
     * @param input
     * @param config
     * @param i18n
     * @returns {Promise<void>}
     */

    async ({db, input, i18n, config}) => {
        const {Token, User} = db;

        const token = await Token.findOne({
            token: input.token,
            type: TOKEN_TYPE_REFRESH
        });

        if (!token) {
            return error(i18n('errors.invalidToken'));
        }

        const user = await User.findOne({ _id: token.userId });

        if (!user) {
            return error(i18n('errors.invalidToken'));
        }

        token.token = await makeToken(128);
        await token.save();

        const {secret, duration} = config.get('plugins.auth.jwt');
        const accessToken = await jwt.sign({_id: user._id}, secret, {expiresIn: duration});

        return success({
            refreshToken: token.token,
            token: accessToken
        });
    }
);