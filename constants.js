const path = require('path');

/**
 * Paths
 */

exports.APP_PATH = path.dirname(require.main.filename);
exports.MODULE_PATH = __dirname;

/**
 * Application events
 * @type {string}
 */

exports.PLUGINS_INIT = 'plugins:init';
exports.SERVER_LISTENING = 'server:listening';

/**
 * Token types
 * @type {number}
 */

exports.TOKEN_TYPE_RESET = 0;
exports.TOKEN_TYPE_CONFIRM = 1;
exports.TOKEN_TYPE_REFRESH = 2;
exports.TOKEN_TYPE_UPDATE_EMAIL = 4;

/**
 * Misc constants
 * @type {number}
 */

exports.REFRESH_TOKEN_EXPIRY = 30;
exports.RESET_TOKEN_EXPIRY = 3;
exports.SOURCE_LOCAL = 0;
exports.SOURCE_REMOTE = 1;
exports.DRIVER_FILE = 'file';
exports.DRIVER_DB = 'db';

/**
 * User statuses
 * @type {number}
 */

exports.USER_STATUS_INACTIVE = 0;
exports.USER_STATUS_ACTIVE = 1;

exports.USER_STATUS_MAP = {
    [exports.USER_STATUS_INACTIVE]: 'Inactive',
    [exports.USER_STATUS_ACTIVE]: 'Active'
};

/**
 * Multi action constants
 * @type {number}
 */

exports.ACTION_REQUEST = 0;
exports.ACTION_HANDLE = 1;
