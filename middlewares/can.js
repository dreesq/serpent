const {getPlugins} = require('../index');
const {error} = require('../utils');

/**
 * Middleware to check if user has permissions
 * @param permissions
 * @returns {Function}
 */

module.exports = permissions => {
    const {i18n} = getPlugins();

    return (req, res, next) => {
        const {user} = req;

        if (!user) {
            next(true);
            return res.status(401).json(error(i18n.translate('errors.requiresAuth')));
        }

        if (!user.can.apply(this, permissions)) {
            next(true);
            return res.status(401).json(error(i18n.translate('errors.requiresAuth')));
        }

        next();
    };
};