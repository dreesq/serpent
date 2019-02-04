const {config, getPlugins} = require('../index');
const {config: configPlugin} = getPlugins();

config({
    name: 'getUser',
    middleware: [
        'auth'
    ],
    enabled: configPlugin.get('plugins.auth')
})(
    /**
     * Returns the authenticated user
     * @param user
     * @returns {Promise<*>}
     */

    async ({user}) => {
        delete user.password;
        delete user.token;
        delete user.ts;
        delete user._id;
        delete user.__v;

        return user;
    }
);