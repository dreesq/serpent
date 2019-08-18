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

    db[toModelName(name)] = mongoose.model(name, model, name);
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

    let models = {};

    await load(MODULE_PATH, 'models', (name, modelPath) => {
        models[name] = modelPath;
    }, false);

    let modelsPath = getValue(appConfig, 'autoload.models');
    modelsPath = modelsPath === true ? 'models' : modelsPath;

    if (modelsPath) {
        await load(APP_PATH, modelsPath, (name, modelPath) => {
            models[name] = modelPath;
        }, false);
    }

    for (const name in models) {
        let path = models[name];
        db.loadModel(name, path);
    }
};

/**
 * Exported models and methods
 * @type {{client: boolean}}
 */

exports.methods = db;