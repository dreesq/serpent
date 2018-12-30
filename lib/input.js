let validator;
let i18n;
let config;

/**
 * Returns an object containing all inputs merged and
 * also handles validation
 *
 * @param req
 * @param actionInput
 */

exports.handle = async (req, actionInput) => {
    let errors = false;

    /**
     * Merge all given input
     */

    const input = {
        ...req.body,
        ...req.query,
        ...req.params,
        ...req.files
    };

    /**
     * Remove unspecified input properties
     * and handle validation
     */

    let returned = false;

    for (const key in actionInput) {
        if (!actionInput.hasOwnProperty(key)) {
            continue;
        }

        let messages = await validator.validateField(input[key], key, actionInput[key], input);

        if (!messages.length) {
            if (!returned) {
                returned = {};
            }

            returned[key] = input[key];
            continue;
        }

        if (!errors) {
            errors = {};
        }

        errors[key] = messages.map(message => req.translate(message, {
            field: key,
            value: actionInput[key]
        }));
    }

    /**
     * Return the output
     */

    return {
        errors,
        input: returned || input
    };
};

/**
 * Make validator accessible by handle function
 * @param context
 */

exports.init = context => {
    const {
        validator: validatorPlugin = false,
        i18n: i18nPlugin,
        config: configPlugin
    } = context.plugins;

    validator = validatorPlugin;
    i18n = i18nPlugin;
    config = configPlugin;
};