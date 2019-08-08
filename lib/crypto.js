const crypto = require('crypto');

/**
 * Plugins
 */

let config;

/**
 * Asymmetric helpers
 * @type {{makeKeyPairs(), encrypt(*=, *=), decrypt(*=, *=)}}
 */

const asymmetric = {
    encrypt(data = '', publicKey = config.get('plugins.crypto.public', '')) {
        if (!publicKey) {
            console.warn('Missing public key.');
        }

        let buffer = new Buffer(data);
        let encrypted = crypto.publicEncrypt(publicKey, buffer);

        return encrypted.toString("base64");
    },
    decrypt(data = '', privateKey = config.get('plugins.crypto.private', '')) {
        if (!privateKey) {
            console.warn('Missing private key. Is it added inside config file?');
        }

        let buffer = new Buffer(data, "base64");
        let decrypted = crypto.privateDecrypt(
            {
                key: privateKey.toString(),
                passphrase: ''
            },
            buffer
        );

        return decrypted.toString("utf8");
    },
    makeKeyPairs(size = 2048) {
        const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa', {
            modulusLength: size,
            namedCurve: 'secp256k1',
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: ''
            }
        });

        return [
            publicKey,
            privateKey
        ];
    }
};

/**
 * Symmetric helpers
 * @type {{encrypt(*=), decrypt(*=)}}
 */

const symmetric = {
    encrypt(data = '') {
        let key = config.get('plugins.crypto.key');

        if (!key) {
            console.warn('Missing symetric key. Is it added inside config file?');
        }

        key = crypto.scryptSync(key, 'salt', 24);
        let iv = Buffer.alloc(16, 0);
        let cipher = crypto.createCipheriv('aes-192-cbc', key, iv);
        let ciphered = cipher.update(data, 'utf-8', 'hex');
        ciphered += cipher.final('hex');
        return ciphered;
    },
    decrypt(data = '') {
        let key = config.get('plugins.crypto.key');

        if (!key) {
            console.warn('Missing symetric key. Is it added inside config file?');
        }

        key = crypto.scryptSync(key, 'salt', 24);
        let iv = Buffer.alloc(16, 0);
        let decrypt = crypto.createDecipheriv('aes-192-cbc', key, iv);
        let decrypted = decrypt.update(data, 'hex', 'utf8');
        decrypted += decrypt.final();

        return decrypted;
    }
};

/**
 * Given length returns random string
 * @param length
 * @returns {Promise<void>}
 */

const random = async (length = 64) => {
    return await crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

/**
 * Given data returns a hash
 * @param data
 * @param algo
 * @returns {Promise<Hash>}
 */

const hash = async (data, algo = 'sha256') => {
    return await crypto.createHash(algo).update(data).digest('hex');
};

/**
 * Plugin initialization
 * @param context
 */

exports.init = async context => {
    const {
        config: configPlugin
    } = context.plugins;

    config = configPlugin;
};

/**
 * Exported methods
 * @type {{}}
 */

exports.build = exports.methods = () => {
    return {
        asymmetric,
        symmetric,
        random,
        hash
    };
};