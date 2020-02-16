const NeDB = require('nedb');
const {APP_PATH, MODULE_PATH} = require('../../constants');
const {get: getValue, toModelName, load, select} = require('../../utils');
const mongoose = require('mongoose');

const allModels = {};

const polyfillModel = (db, schema) => {
    const bind = obj => {
        obj.save = () => {
            if (!obj._id) {
                return Promise.reject();
            }

            return db.updateOne({
                _id: obj._id
            }, obj);
        };

        obj.toObject = () => {
            return obj;
        };

        obj.toJSON = () => {
            return obj;
        };

        obj.remove = () => {
            if (!obj._id) {
                return Promise.reject();
            }

            return db.remove({
                _id: obj._id
            });
        };

        return obj;
    };

    const wrapCursor = cursor => ({
        sort: sort => cursor.sort(sort) && wrapCursor(cursor),
        skip: skip => cursor.skip(skip) && wrapCursor(cursor),
        limit: limit => cursor.limit(limit) && wrapCursor(cursor),
        then: (onFulfilled, onRejected) => {
            const process = async entry => {
                if (cursor._select) {
                    entry = select(entry, cursor._select, true);
                }

                entry = bind(entry);

                if (cursor._populate && cursor._populate.length) {
                    let promises = [];

                    for (const item of cursor._populate) {
                        promises.push(new Promise(async (resolve, reject) => {
                            if (schema.paths[item] instanceof mongoose.SchemaTypes.Array) {
                                let refModel = getValue(schema.paths[item], 'caster.options.ref');
                                entry[item] = await allModels[refModel].find({
                                    _id: {
                                        $in: entry[item]
                                    }
                                });
                                return resolve();
                            }

                            let refModel = getValue(schema.paths[item], 'options.ref');
                            entry[item] = await allModels[refModel].findOne({
                                _id: entry[item]
                            });
                            resolve();
                        }));
                    }

                    await Promise.all(promises);
                }

                return entry;
            };

            let promise = new Promise((resolve, reject) => {
                cursor.exec(async (error, result) => {
                    if (error) {
                        reject(error);
                    }

                    if (cursor._countDocuments) {
                        return Array.isArray(result) ? result.length : (result === null ? 0 : 1);
                    }

                    if (Array.isArray(result)) {
                        let promises = [];
                        for (const entry of result) {
                            promises.push(process(entry));
                        }

                        result = await Promise.all(promises);
                    } else if (typeof result === 'object' && result !== null) {
                        result = await process(result);
                    }

                    resolve(result);
                })
            });

            promise = promise.then(results => onFulfilled(results));

            if (onRejected) {
                promise = promise.catch(onRejected);
            }

            return promise;
        },
        countDocuments: () => cursor._countDocuments = true,
        populate: field => {
            if (!cursor._populate) {
                cursor._populate = [];
            }

            cursor._populate.push(field);
            return wrapCursor(cursor);
        },
        select: fields => {
            cursor._select = fields;
            return wrapCursor(cursor);
        }
    });

    const mapObj = obj => {
        const map = obj => {
            for (const path in schema.paths) {
                if (!obj.hasOwnProperty(path) && schema.paths[path] instanceof mongoose.SchemaTypes.Array) {
                    obj[path] = [];
                }

                if (!obj.hasOwnProperty(path) &&
                    schema.paths[path].options &&
                    schema.paths[path].options.hasOwnProperty('default'))
                {
                    obj[path] = getValue(schema.paths[path], 'options.default', '');
                }
            }

            return obj;
        };

        if (Array.isArray(obj)) {
            return obj.map(map);
        }

        return map(obj);
    };

    const wrapDataStore = () => {
        const methods = {
            insert: doc => new Promise((resolve, reject) => {
                db.insert(mapObj(doc), (err, result) => err ? reject(err) : resolve(bind(result)))
            }),
            update: (query, update, options = {}) => new Promise((resolve, reject) => {
                db.update(query, update, options, (err, result) => err ? reject(err) : resolve(result))
            }),
            remove: (query, options) => new Promise((resolve, reject) => {
                db.remove(query, options = {}, (err, result) => err ? reject(err) : resolve(result))
            }),
            find: (query, projection = {}) => wrapCursor(db.find(query, projection)),
            findOne: (query, projection = {}) => wrapCursor(db.findOne(query, projection)),
            count: (query, projection = {}) => wrapCursor(db.count(query, projection)),
            where: query => {},
            create: data => methods.insert(data),
            findById: (id, projection = {}) => wrapCursor(db.findOne({_id: id}, projection)),
            updateOne: (query, data) => methods.update(query, {$set: data}),
            deleteOne: (query) => methods.remove(query),
            findOneAndUpdate: (query, data) => db.update(query, data),
            deleteMany: (query) => db.remove(query, { multi: true })
        };

        return methods;
    };

    return wrapDataStore();
};

const buildModel = (name, path, schema) => {
    let model = new NeDB({
        filename: `${path}/${name}.db`,
        autoload: true
    });

    return polyfillModel(model, schema);
};

const loadModel = (name, modelPath, storagePath) => {
    name = toModelName(name.substring(0, name.lastIndexOf('.')));
    let model = require(modelPath);

    if (typeof model === 'function') {
        model = model(mongoose.Schema);
    }

    return [toModelName(name), buildModel(name, storagePath, model)];
};

const init = async (context, parent) => {
    const {config: appConfig} = context;
    const {config, logger} = context.plugins;

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

    const dbPath = config.get('plugins.db.path', '');

    for (const name in models) {
        const [modelName, model] = loadModel(name, models[name], dbPath);
        parent[modelName] = allModels[modelName] = model;
    }
};

module.exports = init;
