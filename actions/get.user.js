const {config, getPlugins} = require('../index');
const {removeKeys} = require('../utils');
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
     * @returns {Promise<*>}
     */

    async ({user}) => {
        return removeKeys(user, ['password', 'token', 'ts', '_id', '__v']);
    }
);