const mongoose = require('mongoose');
const {get: getValue, toModelName, load} = require('../../utils');
const {APP_PATH, MODULE_PATH} = require('../../constants');

const db = {};

db.loadModel = (name, modelPath) => {
    name = toModelName(name.substring(0, name.lastIndexOf('.')));
    let model = require(modelPath);

    if (typeof model === 'function') {
        model = model(mongoose.Schema);
    }

    return [toModelName(name), mongoose.model(name, model, name)];
};

const init = async (context, parent) => {
    const {config: appConfig} = context;
    const {config, logger} = context.plugins;

    try {
        await mongoose.connect(config.get('plugins.db.server'), {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        mongoose.set('useCreateIndex', true);
        db.client = mongoose.connection;

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
            const [modelName, model] = db.loadModel(name, models[name]);
            parent[modelName] = model;
        }
    } catch(e) {
        logger.error(e instanceof Error ? e.stack : e);
    }

    mongoose.connection.on('error', logger.error);
};

module.exports = init;
