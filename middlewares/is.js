const {error} = require('../lib/utils');
const {getPlugins} = require('../index');

/**
 * Middleware to check if user has permissions
 * @param options
 * @returns {Function}
 */

module.exports = options => {
    const {i18n} = getPlugins();

    return (req, res, next) => {
        const {user} = req;

        if (!user) {
            next(true);
            return res.status(401).json(error(i18n.translate('errors.requiresAuth')));
        }

        const roles = options.split(',');

        if (!user.is.apply(this, roles)) {
            next(true);
            return res.status(401).json(error(i18n.translate('errors.requiresPermission')));
        }

        next();
    };
};