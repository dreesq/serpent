const winston = require('winston');
const path = require('path');
const {APP_PATH, DRIVER_DB, DRIVER_FILE} = require('../constants');

/**
 * Create the initial instance
 * @type {winston.Logger}
 */

const format = winston.format;
const logger = winston.createLogger();
require('winston-mongodb');

winston.addColors({
    debug: 'cyan',
    verbose: 'red'
});

/**
 * Export the application logger
 * @returns {*}
 */

exports.init = context => {
    const {config, db} = context.plugins;
    const driver = config.get('plugins.logger.driver', 'file');
    const name = config.get('name', 'app');

    /**
     * Additional helper
     * @param obj
     * @param level
     * @returns {winston.Logger}
     */

    logger.json = (obj, level = 'info') => logger[level](JSON.stringify(obj, null, 3));

    /**
     * If logs should be stored inside a file
     */

    if (driver === DRIVER_FILE && config.get('plugins.logger.path')) {
        logger.add(new winston.transports.File({
            filename: path.join(APP_PATH, config.get('plugins.logger.path')),
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            ...config.get('plugins.logger')
        }));
    }

    /**
     * If logs should be stored inside database
     */

    if (driver === DRIVER_DB) {
        logger.add(new winston.transports.MongoDB({
            db: db.client,
            label: name,
            collection: 'Log',
            decolorize: true,
            ...config.get('plugins.logger')
        }));
    }

    logger.add(new winston.transports.Console({
        level: 'debug',
        format: format.combine(
            format.timestamp(),
            format.splat(),
            format.colorize({
                all: true
            }),
            format.json(),
            format.printf(({
                   timestamp,
                   level,
                   message
               }) => {
                return `${timestamp} (${name})(${level}): ${message}`;
            }),
        )
    }));
};

/**
 * Export the logger
 * @type {winston.Logger}
 */

exports.methods = logger;
