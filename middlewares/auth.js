const {getPlugins} = require('../index');
const {error} = require('../utils');

/**
 * Authenticated middleware
 */

module.exports = (options) => {
    const {auth, logger = console} = getPlugins();
    const required = options && options[0] === 'required';

    return async (req, res, next) => {
        const fail = (message = req.translate('errors.requiresAuth')) => {
            res.status(401).json(error(message));
            next(true);
        };

        let user = false;
        let token = req.headers.authorization;

        if (token) {
            try {
                user = await auth.getUser(token, req.translate);
            } catch(e) {
                logger.error(e.stack);
            }
        }

        if (required && !user) {
            return fail();
        }

        req.user = user;
        next();
    };
};