const {config, getPlugins} = require('../index');
const {config: configPlugin} = getPlugins();

config({
    name: 'getUser',
    middleware: [
        'auth'
    ],
    enabled: configPlugin.get('plugins.auth.enabled')
})(
    /**
     * Returns the authenticated user
     * @param user
     * @returns {Promise<*>}
     */

    async ({user}) => {
        return user;
    }
);