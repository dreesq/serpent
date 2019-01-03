const redis = require('redis');
const {promisify} = require('util');

/**
 * Redis plugin
 * @param context
 * @returns {Promise<void>}
 */

module.exports = async context => {
    const {config, logger = console} = context.plugins;

    const redisConfig = config.get('plugins.redis');
    const client = redis.createClient(redisConfig);

    client.on('error', logger.error);

    /**
     * Promisify methods
     * @type {{}}
     */

    const returned = {};

    for (const name in client) {
        const func = client[name];

        if (typeof func !== 'function') {
            continue;
        }

        returned[name] = promisify(func).bind(client);
    }

    return returned;
};