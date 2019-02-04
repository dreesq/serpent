const {getPlugins} = require('../index');
const {error} = require('../utils');

/**
 * Authenticated middleware
 */

module.exports = () => {
    const {auth, i18n, logger = console} = getPlugins();

    return async (req, res, next) => {
        const fail = (message = i18n.translate('errors.requiresAuth')) => {
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