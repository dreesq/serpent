const fs = require('fs');
const qs = require('qs');
const {APP_PATH} = require('../constants');
const path = require('path');
const busboy = require('connect-busboy');
const {promisify} = require('util');
const uuid = require('uuid/v4');

/**
 * Promisify functions
 */

const unlink = promisify(fs.unlink);

/**
 * Helper function
 * @param item
 * @param name
 * @param data
 */

const addData = (item, name, data) => {
    if (Array.isArray(item[name])) {
        item[name].push(data);
        return;
    }

    if (item[name]) {
        item[name] = [item[name], data];
        return;
    }

    item[name] = data;
};

/**
 * Convert to bytes
 * @param text
 * @returns {number}
 */

const unhumanize = text =>{
    const powers = {'k': 1, 'm': 2, 'g': 3, 't': 4};
    const regex = /(\d+(?:\.\d+)?)\s?(k|m|g|t)?b?/i;
    const res = regex.exec(text);

    return res[1] * Math.pow(1024, powers[res[2].toLowerCase()]);
};

/**
 * Upload middleware
 * @param options
 * @returns {Function}
 */

module.exports = options => {
    return (req, res, next) => {
        const middleware = (error) => {
            if (error) {
                return;
            }

            if (!req.busboy) {
                return next();
            }

            let done = false;

            req.body = req.body || {};
            req.files = req.files || {};

            const finish = async () => {
                if (!done) {
                    return;
                }

                let complete = true;

                for (const name in req.files) {
                    let files = req.files[name];

                    if (!Array.isArray(files)) {
                        files = [files];
                    }

                    for (const file of files) {
                        if (!file.done) {
                            complete = false;
                            continue;
                        }

                        if (file.invalid) {
                            await unlink(file.path);
                        }
                    }
                }

                if (complete) {
                    next();
                }
            };

            req.busboy.on('file', (name, file, filename, encoding, mime) => {
                const ext = filename.substr(filename.lastIndexOf('.') + 1);
                const out = path.join(APP_PATH, options[1], '/', `${uuid()}.${ext}`);

                if (options[0].split('|').indexOf(name) === -1) {
                    return file.resume();
                }

                if (!filename || filename === '') {
                    return file.on('data', () => {

                    });
                }

                const data = {
                    field: name,
                    path: out,
                    filename,
                    encoding,
                    mimetype: mime,
                    truncated: false,
                    done: false,
                    isFile: true,
                    async delete() {
                        await unlink(out);
                    }
                };

                const writer = fs.createWriteStream(out);

                writer.on('finish', async () => {
                    data.done = true;
                    await finish();
                });

                file.pipe(writer);

                file.on('limit', () => {
                    data.invalid = true;
                });

                addData(req.files, name, data);
            });

            req.busboy.on('field', (name, data) => {
                addData(req.body, name, data);
            });

            req.busboy.on('finish', async () => {
                req.body = qs.parse(qs.stringify(req.body));
                done = true;
                await finish();
            });

            req.pipe(req.busboy);
        };

        const opts = {
            limits: {
                files: Number(options[3]) || 1,
                fileSize: unhumanize(options[2] || '10 mb')
            }
        };

        return busboy(opts)(req, res, middleware);
    }
};