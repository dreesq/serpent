const winston = require('winston');
const path = require('path');
const {APP_PATH} = require('../constants');

/**
 * Create the initial instance
 * @type {winston.Logger}
 */

const format = winston.format;
const logger = winston.createLogger();

winston.addColors({
    debug: 'cyan',
    verbose: 'red'
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
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            ...config.get('plugins.logger')
        }));
    }

    const name = config.get('name', 'app');

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