const {EventEmitter} = require('events');

/**
 * Cache object
 * @type {boolean}
 */

let emitter = false;

/**
 * Events plugin
 * @param context
 * @returns {boolean}
 */

module.exports = context => {
    if (!emitter) {
        emitter = new EventEmitter();
    }

    return emitter;
};