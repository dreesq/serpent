const {d} = require('../../utils');

let db = {};

/**
 * Available database drivers
 * @type {{nedb: *, mongodb: *}}
 */

const drivers = {
    nedb: require('./nedb'),
    mongodb: require('./mongodb')
};

/**
 * Helpers
 * @param name
 * @param driver
 */

db.registerDriver = (name, driver) => {
    drivers[name] = driver;
};

/**
 * Initialize the database plugin
 * @param context
 */

exports.init = async context => {
    const {config} = context.plugins;
    const driver = config.get('plugins.db.driver');

    if (!drivers[driver]) {
        throw new Error(`Database driver ${driver} does not exist`);
    }

    d(`~ driver ${driver}`);
    await drivers[driver](context, db);
};

/**
 * Exported models and methods
 * @type {{client: boolean}}
 */

exports.methods = db;
