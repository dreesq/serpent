const mongoose = require('mongoose');
const {get: getValue, toModelName, load} = require('../utils');
const {APP_PATH, MODULE_PATH} = require('../constants');

let client = false;
let db = {};

/**
 * Helpers
 * @param name
 * @param modelPath
 */

db.loadModel = (name, modelPath) => {
    name = toModelName(name.substring(0, name.lastIndexOf('.')));
    let model = require(modelPath);

    if (typeof model === 'function') {
        model = model(mongoose.Schema);
    }

    db[toModelName(name)] = mongoose.model(name, model);
};

/**
 * Initialize the database plugin
 * @param context
 */

exports.init = async context => {
    const {config: appConfig} = context;
    const {config} = context.plugins;

    mongoose.connect(config.get('plugins.db.server'), {
        useNewUrlParser: true
    });

    mongoose.set('useCreateIndex', true);
    client = db.client = mongoose.connection;

    /**
     * Load application models
     */

    if (config.get('plugins.auth')) {
        await load(MODULE_PATH, 'models', (name, modelPath) => {
            db.loadModel(name, modelPath);
        }, false);
    }

    if (getValue(appConfig, 'autoload.models')) {
        await load(APP_PATH, 'models', (name, modelPath) => {
            db.loadModel(name, modelPath);
        }, false);
    }
};

/**
 * Exported models and methods
 * @type {{client: boolean}}
 */

exports.methods = db;