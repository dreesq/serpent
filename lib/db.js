const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const mongoose = require('mongoose');
const {get: getValue} = require('./utils');

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

     client = db.client = mongoose.connection;

     /**
      * Load application models
      */

     let models = {
          user: '../models/user.js',
          role: '../models/role.js',
          permission: '../models/permission.js',
          token: '../models/token.js'
     };

     if (getValue(appConfig, 'autoload.models', false)) {
          const appPath = path.dirname(require.main.filename);
          const appModels = await readdir(path.join(appPath, './models'));

          for (const model of appModels) {
               let [name, ext] = model.split('.');
               models[name] = path.join(appPath, './models', model);
          }
     }

     for (const model in models) {
          let modelPath = models[model];
          let name = `${model.charAt(0).toUpperCase()}${model.slice(1)}`;
          db[name] = mongoose.model(name, require(modelPath));
     }
};

/**
 * Exported models and methods
 * @type {{client: boolean}}
 */

exports.methods = db;