const jwt = require('jsonwebtoken');
const {get} = require('../utils');

/**
 * Plugins references
 * @type {boolean}
 */

let config = false;
let db = false;
let socket = false;

/**
 * Auth library
 * @param context
 */

exports.init = context => {
    config = context.plugins.config;
    db = context.plugins.db;
    socket = context.plugins.socket;
};

/**
 * Given token, return user along with permissions
 * @param token
 * @returns {Promise<*>}
 */

const getUser = async token => {
    const secret = config.get('plugins.auth.jwt.secret');
    const payload = await jwt.verify(token, secret);

    if (!payload._id) {
        throw new Error('Could not authenticate user.');
    }

    let user = await db.User.findById(payload._id).populate('role').populate('permissions');

    if (!user) {
        throw new Error('Could not authenticate user.');
    }

    /**
     * Get role and permissions
     */

    user = user.toObject();

    let rolePermissions = [];

    if (get(user, 'role._id')) {
        rolePermissions = await db.Permission.find({roleId: user.role._id}).select('name');
    }

    user.permissions = [
        ...user.permissions,
        ...rolePermissions
    ].reduce((all, current) => {
        return {
            ...all,
            [current.name]: 1
        };
    }, {});

    user.role = get(user, 'role.name');

    user = {
        ...user,
        is(...roles) {
            for (const role of roles) {
                if (role === user.role) {
                    return true;
                }
            }

            return false;
        },
        can(...permissions) {
            for (const permission of permissions) {
                if (user.permissions[permission]) {
                    return true;
                }
            }

            return false;
        }
    };

    if (socket) {
        user.emit = (event, data) => {
            socket.getSocket().in(`user-${user._id}`).emit(event, data);
        };
    }

    return user;
};

exports.methods = {
    getUser
};