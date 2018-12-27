const {config} = require('../index');
const {success} = require('../lib/utils');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Local provider
 * @param db
 * @param config
 * @param input
 * @param i18n
 * @returns {Promise<void>}
 */

const local = async ({db, config, input, i18n}) => {
    const {User} = db;
    const {email} = input;

    const secret = config.get('plugins.auth.jwt.secret');
    const duration = config.get('plugins.auth.jwt.duration');

    let user = await User.findOne({email});

    if (!user) {
        throw new Error(i18n('errors.invalidLogin'));
    }

    const ok = await bcrypt.compare(input.password, user.password);

    if (!ok) {
        throw new Error(i18n('errors.invalidLogin'));
    }

    const token = await jwt.sign({_id: user._id}, secret, {expiresIn: duration});
    return success(token);
};

/**
 * Facebook provider
 * @returns {Promise<void>}
 */

const fb = async ({db, config, input, axios}) => {
    const {User} = db;
    const {accessToken} = input;

    const secret = config.get('plugins.auth.jwt.secret');
    const duration = config.get('plugins.auth.jwt.duration');

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
    return success(token);
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
        provider: 'required|string'
    }
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