const {config, getPlugins} = require('../index');
const {TOKEN_TYPE_REFRESH} = require('../constants');
const {success, makeToken} = require('../lib/utils');
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

    const refreshToken = await makeToken(128);

    await Token.create({
        token: refreshToken,
        userId: user._id,
        type: TOKEN_TYPE_REFRESH
    });

    return refreshToken;
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

    const authConfig = config.get('plugins.auth');
    const {secret, duration} = authConfig.jwt || {};

    let user = await User.findOne({email});

    if (!user) {
        throw new Error(i18n('errors.invalidLogin'));
    }

    const ok = await bcrypt.compare(input.password, user.password);

    if (!ok) {
        throw new Error(i18n('errors.invalidLogin'));
    }

    const token = await jwt.sign({_id: user._id}, secret, {expiresIn: duration});
    const res = {token};

    if (authConfig.refresh && input.refresh) {
        res.refresh = await createRefreshToken(user, Token);
    }

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

    const token = await jwt.sign({_id: user._id}, secret, {expiresIn: duration});
    const res = {token};

    if (authConfig.refresh && input.refresh) {
        res.refresh = await createRefreshToken(user, Token);
    }

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
    enabled: configPlugin.get('plugins.auth.enabled')
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

        if (strategies.indexOf(provider) === -1) {
            throw new Error(i18n('errors.invalidProvider'));
        }

        return await providers[provider](ctx);
    }
);