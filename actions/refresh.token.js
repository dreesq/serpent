const {config, getPlugins} = require('../index');
const {TOKEN_TYPE_REFRESH, REFRESH_TOKEN_EXPIRY} = require('../constants');
const {error, success, makeToken, hash} = require('../utils');
const {config: configPlugin} = getPlugins();
const moment = require('moment');

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
        const t = i18n.translate;

        const token = await Token.findOne({
            token: hash(input.token),
            type: TOKEN_TYPE_REFRESH
        });

        if (!token) {
            return error(t('errors.invalidToken'));
        }

        const diff = moment().diff(moment(token.createdAt), 'days');

        if (diff > REFRESH_TOKEN_EXPIRY) {
            await token.remove();
            return error(t('errors.expiredToken'));
        }

        const user = await User.findOne({ _id: token.userId });

        if (!user) {
            return error(t('errors.invalidToken'));
        }

        const newToken = await makeToken(128);
        token.token = hash(newToken);
        await token.save();

        const {secret, duration} = config.get('plugins.auth.jwt');
        const accessToken = await jwt.sign({_id: user._id}, secret, {expiresIn: duration});

        return success({
            refreshToken: newToken,
            token: accessToken
        });
    }
);