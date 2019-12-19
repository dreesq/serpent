const {error} = require('../utils');

/**
 * Middleware to check if user has permissions
 * @param roles
 * @returns {Function}
 */

module.exports = roles => {
    return (req, res, next) => {
        const {user} = req;

        if (!user) {
            next(true);
            return res.status(401).json(error(req.translate('errors.requiresAuth')));
        }

        if (!user.is.apply(this, Object.keys(roles))) {
            next(true);
            return res.status(401).json(error(req.translate('errors.requiresPermission')));
        }

        next();
    };
};
