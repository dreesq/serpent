const {toQueryString} = require('../utils');

let config;

/**
 * Utilities plugin
 * @param context
 * @returns {Promise<void>}
 */

exports.init = async context => {
    const {config: configPlugin} = context.plugins;
    config = configPlugin;
};

/**
 * Exported methods
 * @type {{url()}}
 */

exports.methods = {
    build(req) {
        const {lang = ''} = req;

        return {
            url(path, params = {}, locale = lang) {
                return `${config.get('baseUrl', '')}${locale ? `/${locale}/` : '/'}${path}${toQueryString(params)}`;
            }
        }
    }
};