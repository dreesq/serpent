const {getPlugins} = require('../index');
const {error} = require('../lib/utils');
const jwt = require('jsonwebtoken');

/**
 * Authenticated middleware
 */

module.exports = () => {
    const {db, config, socket} = getPlugins();

    return async (req, res, next) => {
        const fail = () => {
            res.status(401).json(error('Action requires authentication.'));
            next(true);
        };

        if (!req.headers.authorization) {
            return fail();
        }

        const token = req.headers.authorization;
        const secret = config.get('plugins.auth.jwt.secret');

        try {
            const payload = await jwt.verify(token, secret);

            if (!payload._id) {
                return fail();
            }

            const user = await db.User.findById(payload._id);

            if (!user) {
                return fail();
            }

            req.user = {
                ...user,
                is(role) {

                },
                can(permission) {

                },
                emit(event, data) {
                    socket.getSocket().in(`user-${user._id}`).emit(event, data);
                }
            };
        } catch(e) {
            return fail();
        }

        next();
    };
};