const {error} = require('../lib/utils');

/**
 * Middleware to check if user has permissions
 * @param options
 * @returns {Function}
 */

module.exports = options => {
    return (req, res, next) => {
        const {user} = req;

        if (!user) {
            next(true);
            return res.status(401).json(error('User is not authenticated.'));
        }

        const roles = options.split(',');

        if (!user.is(roles)) {
            next(true);
            return res.status(401).json(error('User is not allowed to access this.'));
        }

        next();
    };
};