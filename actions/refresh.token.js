const {config, getPlugins} = require('../index');
const {TOKEN_TYPE_REFRESH, REFRESH_TOKEN_EXPIRY} = require('../constants');
const {error, success, makeToken, hash} = require('../utils');
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

        const [newToken, guid] = await Promise.all([
            makeToken(128),
            makeToken(12)
        ]);

        token.token = hash(newToken);
        token.guid = guid;
        await token.save();

        const {secret, duration} = config.get('plugins.auth.jwt');
        const payload = {_id: user._id, ts: user.ts, guid: token.guid};

        const accessToken = await jwt.sign(payload, secret, {expiresIn: duration});

        return success({
            refreshToken: newToken,
            token: accessToken
        });
    }
);