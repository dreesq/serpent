const {getPlugins} = require('../index');
const {error} = require('../utils');

/**
 * Authenticated middleware
 */

module.exports = () => {
    const {auth, logger = console} = getPlugins();

    return async (req, res, next) => {
        const fail = (message = req.translate('errors.requiresAuth')) => {
            res.status(401).json(error(message));
            next(true);
        };

        if (!req.headers.authorization) {
            return fail();
        }

        const token = req.headers.authorization;

        try {
            req.user = await auth.getUser(token);
        } catch(e) {
            logger.error(e.stack);
            return fail(e.message);
        }

        next();
    };
};