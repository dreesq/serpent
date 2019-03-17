const Stripe = require('stripe');
const {select} = require('../utils');

/**
 * Stripe object
 * @type {boolean}
 */

let stripe = false;

/**
 * Plugin initialization
 * @param context
 */

exports.init = async context => {
    const {config} = context.plugins;
    stripe = Stripe(config.get('plugins.stripe.secretKey'));
};

/**
 * Get all available stripe products
 * @param options
 * @param fields
 * @returns {Promise<void>}
 */

let getProducts = async (options = {}, fields = []) => {
    let data = await stripe.products.list(options);

    if (fields.length) {
        data = data.map(item => select(item, fields));
    }

    return data;
};

/**
 * Returns user's payment sources
 * @param user
 * @returns {Function}
 */

let getUserSources = user => {
    return async () => {

    };
};

/**
 * Subscribes user to a plan
 * @param user
 * @returns {Function}
 */

let subscribeUser = user => {
    return async () => {

    };
};

/**
 * Given an user source,
 * handle a payment request
 * @param user
 * @returns {Function}
 */

let userPay = user => {
    return async () => {

    };
};

/**
 * Unsubscribes user from a plan
 * @param user
 * @returns {Function}
 */

let unsubscribeUser = user => {
    return async () => {

    };
};

/**
 * Returns user's invoices
 * @param user
 * @returns {Function}
 */

let getUserInvoices = user => {
    return async () => {

    };
};

/**
 * Exported methods
 * @type {{}}
 */

exports.methods = {
    build(req) {
        if (req.user) {
            req.user.stripe = {
                sources: getUserSources(req.user),
                subscribe: subscribeUser(req.user),
                unsubscribe: unsubscribeUser(req.user),
                invoices: getUserInvoices(req.user),
                pay: userPay(req.user)
            };
        }

        return {
            client: stripe,
            products: getProducts
        }
    }
};