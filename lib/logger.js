const winston = require('winston');
const path = require('path');
const {APP_PATH} = require('../constants');

/**
 * Create the initial instance
 * @type {winston.Logger}
 */

const logger = winston.createLogger({
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ]
});

/**
 * Export the application logger
 * @returns {*}
 */

exports.init = context => {
    const {config} = context.plugins;

    /**
     * If logs should be stored inside a file
     */

    if (config.get('plugins.logger.path')) {
        logger.add(new winston.transports.File({
            filename: path.join(APP_PATH, config.get('plugins.logger.path')),
            ...config.get('plugins.logger')
        }));
    }
};

/**
 * Export the logger
 * @type {winston.Logger}
 */

exports.methods = logger;