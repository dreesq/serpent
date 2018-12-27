const {config} = require('../index');

config({
    name: 'getUser',
    middleware: [
        'auth'
    ]
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