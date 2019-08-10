const {config, getPlugins} = require('../index');
const {success, makeToken, hookRunner} = require('../utils');
const {config: configPlugin} = getPlugins();
const bcrypt = require('bcryptjs');

/**
 * Local provider
 * @param db
 * @param config
 * @param input
 * @param t
 * @param runner
 * @param auth
 * @returns {Promise<void>}
 */

const local = async ({db, input, t, auth}, runner) => {
    const {User} = db;
    const {email} = input;

    let user = await User.findOne({email});

    if (!user) {
        runner('failed', input);
        throw {
            message: t('errors.invalidLogin'),
            status: 400
        };
    }

    const ok = await bcrypt.compare(input.password, user.password);

    if (!ok) {
        runner('failed', input);
        throw {
            message: t('errors.invalidLogin'),
            status: 400
        }
    }

    const res = await auth.authenticateUser(user, input.refresh);
    return success(res);
};

/**
 * 3rd party providers
 * @returns {Promise<void>}
 */

const providers = {
    fb: {
        endpoint: 'https://graph.facebook.com/v2.12/me',
        dbField: 'facebookId',
        resultField: 'id',
        payload(accessToken) {
            return {
                params: {
                    access_token: accessToken,
                    fields: 'email,name,locale,timezone'
                }
            }
        }
    },
    google: {
        endpoint: 'https://www.googleapis.com/oauth2/v3/tokeninfo',
        dbField: 'googleId',
        resultField: 'sub',
        payload(accessToken) {
            return {
                params: {
                    access_token: accessToken
                }
            }
        }
    }
};

/**
 * Factory for social login provider
 * @param provider
 * @returns {function({db: *, config: *, input: *, axios: *}, *): ({success}|string)}
 */

const makeProvider = provider => async ({db, config, input, axios, auth}, runner) => {
    const providerConfig = providers[provider];

    const {User} = db;
    const {accessToken} = input;

    const {data} = await axios.get(
        providerConfig.endpoint,
        providerConfig.payload(accessToken)
    );

    let user = await User.findOne({
        [providerConfig.dbField]: data[providerConfig.resultField]
    });

    /**
     * Create the user if not already created
     */

    if (!user) {
        const row = {
            name: data.name,
            locale: data.locale,
            [providerConfig.dbField]: data[providerConfig.resultField],
            password: await makeToken(128)
        };

        runner('create', row, input);
        user = await User.create(row);
    }

    const res = await auth.authenticateUser(user, input.refresh);
    return success(res);
};

/**
 * All providers
 * @type {{local: local, fb: *}}
 */

const allProviders = {
    local,
    fb: makeProvider('fb'),
    google: makeProvider('google')
};

config({
    name: 'login',
    input: {
        email: 'required|email|when:provider,local',
        password: 'required|min:10|when:provider,local',
        accessToken: 'required|when:provider,!local',
        provider: 'required|string',
        ...(configPlugin.get('plugins.auth.refresh') ? {refresh: 'number'} : {})
    },
    enabled: configPlugin.get('plugins.auth')
})(
    /**
     * Default login action
     * @param ctx
     * @returns {Promise<void>}
     */

    async ctx => {
        const {config, input, t, options} = ctx;
        const {provider} = input;
        const strategies = config.get('plugins.auth.strategies');
        const runner = hookRunner(options);

        if (strategies.indexOf(provider) === -1) {
            throw {
                message: t('errors.invalidProvider'),
                status: 400
            }
        }

        runner('before', input);
        const result = await allProviders[provider](ctx, runner);
        runner('after', input, result);
        return result;
    }
);