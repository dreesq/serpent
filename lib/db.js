const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const mongoose = require('mongoose');
const {get: getValue, toModelName, load} = require('../utils');
const {APP_PATH, MODULE_PATH} = require('../constants');

let client = false;
let db = {};

/**
 * Promisify functions
 */

const readdir = promisify(fs.readdir);

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

    if (getValue(appConfig, 'autoload.models')) {
        await load(APP_PATH, 'models', (name, modelPath) => {
            name = toModelName(name.substring(0, name.lastIndexOf('.')));
            db[toModelName(name)] = mongoose.model(name, require(modelPath));
        }, false);
    }

    if (config.get('plugins.auth')) {
        await load(MODULE_PATH, 'models', (name, modelPath) => {
            name = toModelName(name.substring(0, name.lastIndexOf('.')));
            db[name] = mongoose.model(name, require(modelPath));
        }, false);
    }
};

/**
 * Exported models and methods
 * @type {{client: boolean}}
 */

exports.methods = db;