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
        user = user.toObject();
        delete user.password;
        return user;
    }
);