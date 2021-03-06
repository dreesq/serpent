const {error} = require('../utils');
const moment = require('moment');

/**
 * Store requests in memory
 * @type {{}}
 */

const store = {};

/**
 * Clean store interval
 */

!process.env.LAMBDA_ENV && setInterval(() => {
    for (const ip in store) {
        for (const name in store[ip]) {
            if (!store[ip].hasOwnProperty(name)) {
                continue;
            }

            if (moment().diff(store[ip][name][1], 'hours') >= store[ip][name][2]) {
                delete store[ip][name];
            }
        }
    }
}, 1000);

/**
 * Middleware to limit number of requests per hour
 * @param options
 * @returns {Function}
 */

module.exports = options => {
    return (req, res, next) => {
        if (!store[req.ip]) {
            store[req.ip] = {};
        }

        let name = req.name ? req.name : `${req.method}-${req.path}`;

        if (!store[req.ip][name]) {
            store[req.ip][name] = [0, new Date(), options.time];
        }

        const current = store[req.ip][name];

        if (current[0] > options.limit) {
            next(true);
            return res.status(429).json(error(req.translate('errors.rateLimit')));
        }

        current[0] += 1;
        current[1] = new Date();

        next();
    };
};
