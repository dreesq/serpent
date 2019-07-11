const winston = require('winston');
const path = require('path');
const {APP_PATH} = require('../constants');

/**
 * Create the initial instance
 * @type {winston.Logger}
 */

const logger = winston.createLogger({
    format: winston.format.timestamp(),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.splat(),
                winston.format.colorize({
                    all: true
                }),
                winston.format.json(),
                winston.format.printf(info => `${info.timestamp} (${info.level}): ${info.message}`),
            )
        })
    ]
});

/**
 * Export the application logger
 * @returns {*}
 */

exports.init = context => {
    const {config} = context.plugins;

    /**
     * Additional helper
     * @param obj
     * @returns {winston.Logger}
     */

    logger.json = obj => logger.info(`\n-----\n${JSON.stringify(obj, null, 3)}\n-----`);

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