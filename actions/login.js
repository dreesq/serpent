const {config} = require('../index');

config({
    name: 'login',
    input: {
        username: 'required|string',
        password: 'required|string'
    }
})(

    /**
     * Default login action
     * @param db
     * @param input
     * @returns {Promise<void>}
     */

    async ({ db, input }) => {
        
    }
);