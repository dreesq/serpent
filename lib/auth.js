
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
};

