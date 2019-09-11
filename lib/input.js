let validator;
let i18n;
let config;

/**
 * Returns an object containing all inputs merged
 *
 * @param req
 */

exports.merge = req => {

    /**
     * Merge all given input
     */

    return {
        ...req.body,
        ...req.query,
        ...req.params,
        ...req.files
    };
};

/**
 * Based on rules, validate and translates inputs
 * @param input
 * @param rules
 * @param translate
 * @returns {Promise<{input: (boolean|*), errors: boolean}>}
 */

exports.validate = validate = async (input, rules, translate) => {
    let errors = false;
    let returned = false;

    /**
     * Remove unspecified input properties
     * and handle validation
     */

    for (const key in rules) {
        if (!rules.hasOwnProperty(key)) {
            continue;
        }

        if (typeof rules[key] === 'object') {
            const {errors: localErrors} = await validate(input[key] || {}, rules[key], translate);

            if (localErrors) {
                if (!errors) {
                    errors = {};
                }

                if (!errors[key]) {
                    errors[key] = {};
                }

                errors[key] = {
                    ...errors[key],
                    ...localErrors
                };
            }
        }

        let messages = await validator.validateField(input[key], key, rules[key], input);

        if (!messages.length) {
            if (!returned) {
                returned = {};
            }

            if (typeof input[key] !== 'undefined') {
                returned[key] = input[key];
            }

            continue;
        }

        if (!errors) {
            errors = {};
        }

        errors[key] = messages.map(result => translate(result.message, {
            field: key,
            value: input[key],
            options: result.options
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
