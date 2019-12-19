const {error} = require('../utils');

/**
 * Middleware to check if user has permissions
 * @param permissions
 * @returns {Function}
 */

module.exports = permissions => {
    return (req, res, next) => {
        const {user} = req;

        if (!user) {
            next(true);
            return res.status(403).json(error(req.translate('errors.requiresAuth')));
        }

        if (!user.can.apply(this, Object.keys(permissions))) {
            next(true);
            return res.status(403).json(error(req.translate('errors.requiresPermission')));
        }

        next();
    };
};
