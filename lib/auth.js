const passport = require('passport');
const Local = require('passport-local').Strategy;
const Jwt = require('passport-jwt').Strategy;

/**
 * Local strategy
 */

const localStrategy = context => {
    //passport.use();
};

/**
 * Setup stragey helper
 * @param strategy
 * @param context
 */

const setup = (strategy, context) => {
    const items = {
        local: localStrategy
    };

    if (!items[strategy]) {
        throw new Error(`Invalid strategy ${strategy}.`);
    }

    return items[strategy](context);
};

/**
 * Authentication plugin
 * @param context
 */

exports.init = context => {
    const {config} = context.plugins;
    const authConfig = config.get('plugins.auth');
    const {strategies} = authConfig;

    if (strategies.local) {
        setup('local', context);
    }
};

