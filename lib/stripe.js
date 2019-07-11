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
 * Given an user, creates a customer if not already created
 * @param user
 * @returns {Function}
 */

let userCreateCustomer = async user => {
    return async (source, extra = {}) => {
        return await stripe.customers.create({
            source,
            ...extra
        });
    };
};

/**
 * Get all available stripe products
 * @param options
 * @param fields
 * @returns {Promise<void>}
 */

let getProducts = async (options = {}, fields = []) => {
    let {data} = await stripe.products.list(options);

    if (fields.length) {
        data = data.map(item => select(item, fields));
    }

    return data;
};

/**
 * Get all available stripe plans
 * @param options
 * @param fields
 * @returns {Promise<void>}
 */

let getPlans = async (options = {}, fields = []) => {
    let {data} = await stripe.plans.list(options);

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
    return async (filters = {}) => {
        return await stripe.customers.listSources(user.stripeId, filters);
    };
};

/**
 * Subscribes user to a plan
 * @param user
 * @returns {Function}
 */

let subscribeUser = user => {
    return async (items = []) => {
        return await stripe.subscriptions.create({
            customer: user.stripeId,
            items
        });
    };
};

/**
 * Given an user source,
 * handle a payment request
 * @param user
 * @returns {Function}
 */

let userPay = user => {
    return async (amount = 0, currency = '', extra = {}) => {
        const options = {
            amount: amount * 100,
            currency: currency.toLowerCase(),
            ...extra
        };

        if (!options.source) {
            options.customer = user.stripeId;
        }

        return await stripe.charges.create(options);
    };
};

/**
 * Unsubscribes user from a plan
 * @param user
 * @returns {Function}
 */

let unsubscribeUser = user => {
    return async id => {
        return await stripe.subscriptions.del(id);
    };
};

/**
 * Returns user's subscriptions
 * @param user
 * @returns {Function}
 */

let getUserSubscriptions = user => {
    return async (filters = {}) => {
        return await stripe.subscriptions.list({
            customer: user.stripeId,
            ...filters
        });
    };
};

/**
 * Returns user's invoices
 * @param user
 * @returns {Function}
 */

let getUserInvoices = user => {
    return async (filters = {}) => {
        return await stripe.invoiceItems.list({
            customer: user.stripeId,
            ...filters
        });
    };
};

/**
 * Adds a new source the user, if missing stripeId,
 * creates a new Stripe customer record
 *
 * @param user
 * @returns {Function}
 */

let addUserSource = user => {
    return async source => {
        return await stripe.customers.createSource(user.stripeId, {
            source
        });
    };
};

/**
 * Exported methods
 * @type {{}}
 */

exports.build = req => {
    if (req.user) {
        req.user.stripe = {
            addSource: addUserSource(req.user),
            sources: getUserSources(req.user),
            subscribe: subscribeUser(req.user),
            unsubscribe: unsubscribeUser(req.user),
            invoices: getUserInvoices(req.user),
            pay: userPay(req.user),
            subscriptions: getUserSubscriptions(req.user),
            createCustomer: userCreateCustomer(req.user)
        };
    }

    return {
        client: stripe,
        products: getProducts,
        plans: getPlans
    }
};