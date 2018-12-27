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

/**
 * User statuses
 * @type {number}
 */

exports.USER_STATUS_INACTIVE = 0;
exports.USER_STATUS_ACTIVE = 1;