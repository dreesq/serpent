const {EventEmitter} = require('events');

/**
 * Cache object
 * @type {boolean}
 */

let emitter = false;

/**
 * Events plugin
 * @returns {boolean}
 */

module.exports = () => {
    if (!emitter) {
        emitter = new EventEmitter();
    }

    return emitter;
};