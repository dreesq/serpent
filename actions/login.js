const {config, getPlugins} = require('../index');
const {TOKEN_TYPE_REFRESH} = require('../constants');
const {success, makeToken, hash} = require('../utils');
const {config: configPlugin} = getPlugins();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Creates a refresh token
 * @param user
 * @param Token
 */

const createRefreshToken = async (user, Token) => {
    const tokens = await Token.find({
        userId: user._id,
        type: TOKEN_TYPE_REFRESH
    });

    if (tokens.length >= 10) {
        await tokens[0].remove();
    }

    const [guid, refreshToken] = await Promise.all([
        makeToken(12),
        makeToken(128)
    ]);

    await Token.create({
        token: hash(refreshToken),
        userId: user._id,
        guid,
        type: TOKEN_TYPE_REFRESH
    });

    return {
        refreshToken,
        guid
    };
};

/**
 * Local provider
 * @param db
 * @param config
 * @param input
 * @param i18n
 * @returns {Promise<void>}
 */

const local = async ({db, config, input, i18n}) => {
    const {User, Token} = db;
    const {email} = input;
    const t = i18n.translate;

    const authConfig = config.get('plugins.auth');
    const {secret, duration} = authConfig.jwt || {};

    let user = await User.findOne({email});

    if (!user) {
        throw new Error(t('errors.invalidLogin'));
    }

    const ok = await bcrypt.compare(input.password, user.password);

    if (!ok) {
        throw new Error(t('errors.invalidLogin'));
    }

    const res = {};
    const payload = {_id: user._id, ts: user.ts};

    if (authConfig.refresh && input.refresh) {
        const {refreshToken, guid} = await createRefreshToken(user, Token);

        res.refresh = refreshToken;
        payload.guid = guid;
    }

    res.token = await jwt.sign(payload, secret, {expiresIn: duration});
    return success(res);
};

/**
 * Facebook provider
 * @returns {Promise<void>}
 */

const fb = async ({db, config, input, axios}) => {
    const {User, Token} = db;
    const {accessToken} = input;

    const authConfig = config.get('plugins.auth');
    const {secret, duration} = authConfig.jwt || {};

    const {data} = await axios.get('https://graph.facebook.com/v2.12/me', {
        params: {
            access_token: accessToken,
            fields: 'email,name,locale,timezone'
        }
    });

    let user = await User.findOne({
        facebookId: data.id
    });

    /**
     * Create the user if not already created
     */

    if (!user) {
        user = await User.create({
            name: data.name,
            locale: data.locale,
            timezone: data.timezone,
            facebookId: data.id
        });
    }

    const res = {};
    const payload = {_id: user._id, ts: user.ts};

    if (authConfig.refresh && input.refresh) {
        const {refreshToken, guid} = await createRefreshToken(user, Token);

        res.refresh = refreshToken;
        payload.guid = guid;
    }

    res.token = await jwt.sign(payload, secret, {expiresIn: duration});
    return success(res);
};

/**
 * All providers
 * @type {{local: local, fb: *}}
 */

const providers = {
    local,
    fb
};

config({
    name: 'login',
    input: {
        email: 'string|when:provider,local',
        password: 'string|when:provider,local',
        accessToken: 'string|when:provider,!local',
        provider: 'required|string',
        refresh: 'number'
    },
    enabled: configPlugin.get('plugins.auth')
})(
    /**
     * Default login action
     * @param ctx
     * @returns {Promise<void>}
     */

    async ctx => {
        const {config, input, i18n} = ctx;
        const {provider} = input;
        const strategies = config.get('plugins.auth.strategies');
        const t = i18n.translate;

        if (strategies.indexOf(provider) === -1) {
            throw new Error(t('errors.invalidProvider'));
        }

        return await providers[provider](ctx);
    }
);