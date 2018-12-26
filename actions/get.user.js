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

    async ({ user }) => {
        delete user.password;
        return user;
    }
);