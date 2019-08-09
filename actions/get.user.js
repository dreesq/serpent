const {config, getPlugins} = require('../index');
const {removeKeys, hookRunner} = require('../utils');
const {config: configPlugin} = getPlugins();

config({
    name: 'getUser',
    middleware: [
        'auth:required'
    ],
    enabled: configPlugin.get('plugins.auth')
})(
    /**
     * Returns the authenticated user
     * @param user
     * @param options
     * @returns {Promise<*>}
     */

    async ({user, options}) => {
        const runner = hookRunner(options);
        const result = removeKeys(user, [
            'password',
            'token',
            'ts',
            '_id',
            '__v',
            'createdAt',
            'updatedAt',
            'stripe'
        ]);

        runner('before', user);
        return result;
    }
);