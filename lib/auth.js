const jwt = require('jsonwebtoken');
const {get, makeToken} = require('../utils');
const {TOKEN_TYPE_REFRESH} = require('../constants');

/**
 * Plugins references
 * @type {boolean}
 */

let config = false;
let db = false;
let socket = false;
let stripe = false;
let crypto = false;
let i18n = false;

/**
 * Auth library
 * @param context
 */

exports.init = context => {
    config = context.plugins.config;
    db = context.plugins.db;
    socket = context.plugins.socket;
    stripe = context.plugins.stripe;
    crypto = context.plugins.crypto;
    i18n = context.plugins.i18n;
};

/**
 * Given token, return user along with permissions
 * @param token
 * @param translate
 * @returns {Promise<*>}
 */

const getUser = async (token, translate) => {
    const secret = config.get('plugins.auth.jwt.secret');
    const payload = await jwt.verify(token, secret);

    if (!payload._id) {
        throw {
            message: translate('errors.authFailed'),
            status: 400
        };
    }

    let user = await db.User.findById(payload._id).populate('role').populate('permissions');

    if (!user) {
        throw {
            message: translate('errors.authFailed'),
            status: 400
        };
    }

    if (user.ts !== payload.ts) {
        throw {
            message: translate('errors.expiredToken'),
            status: 400
        }
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
        ...(user.permissions || []),
        ...rolePermissions
    ].reduce((all, current) => {
        if (!current) {
            return all;
        }

        return {
            ...all,
            [current.name]: 1
        };
    }, {});

    user.role = get(user, 'role.name', '');

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
        },
        token: payload
    };

    return user;
};

/**
 * Given an user creates a new refresh token
 * @param user
 * @returns {Promise<{guid: *, refreshToken: *}>}
 */

const createRefreshToken = async (user) => {
    const {Token} = db;
    const {hash} = crypto;
    const tokens = await Token.find({
        userId: user._id,
        type: TOKEN_TYPE_REFRESH
    });

    if (tokens.length >= 10) {
        await tokens[0].remove();
    }

    const [guid, refreshToken] = await Promise.all([
        makeToken(12),
        makeToken(128)
    ]);

    await Token.create({
        token: await hash(refreshToken),
        userId: user._id,
        guid,
        type: TOKEN_TYPE_REFRESH
    });

    return {
        refreshToken,
        guid
    };
};

/**
 * Given payload, returns an access token
 * @param user
 * @returns {Promise<void>}
 */

const createAccessToken = async (user = {}) => {
    const authConfig = config.get('plugins.auth');
    const {secret, duration} = authConfig.jwt || {};

    return jwt.sign({
        _id: user._id,
        ts: user.ts
    }, secret, {
        expiresIn: duration
    });
};

/**
 * Given an user
 * @param user
 * @param refresh
 */

const authenticateUser = async (user, refresh = false) => {
    const res = {};
    const payload = {_id: user._id, ts: user.ts};

    if (refresh) {
        const {refreshToken, guid} = await createRefreshToken(user);
        res.refresh = refreshToken;
        payload.guid = guid;
    }

    res.token = await createAccessToken(user);
    return res;
};

/**
 * Exported methods
 */

exports.methods = {
    getUser,
    authenticateUser,
    createRefreshToken,
    createAccessToken
};
