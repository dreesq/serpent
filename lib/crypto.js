const crypto = require('crypto');

/**
 * @TODO: Check if the module works in server less environment
 */

/**
 * Plugin initialization
 * @param context
 */

exports.init = async context => {
    const {config} = context.plugins;
};

const asymetric = {
    encrypt(data = '', publicKey = '') {

    },
    decrypt(data = '', privateKey = '') {

    },
    makeKeyPairs() {

    }
};

const symetric = {
    encrypt(data = '') {

    },
    decrypt(data = '') {

    }
};

const random = async (length = 64) => {
    return await crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
};

/**
 * Exported methods
 * @type {{}}
 */

exports.methods = {
    asymetric,
    symetric,
    random
};