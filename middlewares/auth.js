const {getPlugins} = require('../index');
const {error} = require('../lib/utils');

/**
 * Authenticated middleware
 */

module.exports = () => {
    const {auth, i18n, logger = console} = getPlugins();

    return async (req, res, next) => {
        const fail = () => {
            res.status(401).json(error(i18n.translate('errors.requiresAuth')));
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
            return fail();
        }

        next();
    };
};