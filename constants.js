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

/**
 * User statuses
 * @type {number}
 */

exports.USER_STATUS_INACTIVE = 0;
exports.USER_STATUS_ACTIVE = 1;

/**
 * User account reset actions
 * @type {number}
 */

exports.ACTION_REQUEST_RESET = 0;
exports.ACTION_RESET = 1;