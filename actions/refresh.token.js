const {config, getPlugins} = require('../index');
const {TOKEN_TYPE_REFRESH, REFRESH_TOKEN_EXPIRY} = require('../constants');
const {error, success, makeToken, hookRunner} = require('../utils');
const {config: configPlugin} = getPlugins();
const moment = require('moment');
const jwt = require('jsonwebtoken');

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
     * @param crypto
     * @param t
     * @param options
     * @returns {Promise<void>}
     */

    async ({db, input, t, crypto, config, options}) => {
        const {Token, User} = db;
        const runner = hookRunner(options);

        const token = await Token.findOne({
            token: await crypto.hash(input.token),
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

        const user = await User.findOne({
            _id: token.userId
        });

        runner('before', user);

        if (!user) {
            return error(t('errors.invalidToken'));
        }

        const [newToken, guid] = await Promise.all([
            makeToken(128),
            makeToken(12)
        ]);

        token.token = await crypto.hash(newToken);
        token.guid = guid;
        await token.save();
        runner('after', user, token);

        const {secret, duration} = config.get('plugins.auth.jwt');
        const payload = {_id: user._id, ts: user.ts, guid: token.guid};
        const accessToken = await jwt.sign(payload, secret, {expiresIn: duration});

        return success({
            refresh: newToken,
            token: accessToken
        });
    }
);