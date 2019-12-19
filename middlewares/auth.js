const {getPlugins} = require('../index');
const {error} = require('../utils');

/**
 * Authenticated middleware
 */

module.exports = (options) => {
    const {auth} = getPlugins();
    const source = options.source || 'headers';
    const key = options.key || 'authorization';

    return async (req, res, next) => {
        const fail = (message = req.translate('errors.requiresAuth')) => {
            res.status(401).json(error(message));
        };

        let user = false;
        let token = req[source][key];

        if (token) {
            try {
                user = await auth.getUser(token, req.translate);
            } catch(e) {

            }
        }

        if (options.required && !user) {
            return fail();
        }

        req.user = user;
        next();
    };
};
