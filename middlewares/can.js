const {getPlugins} = require('../index');
const {error} = require('../lib/utils');

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

        const permissions = options.split(',');

        if (!user.can.apply(this, permissions)) {
            next(true);
            return res.status(401).json(error(i18n.translate('errors.requiresAuth')));
        }

        next();
    };
};