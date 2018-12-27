let db;
let i18n;

/**
 * Validator rules
 * @type {{}}
 */

const allRules = translate => ({
    required(value, field, opts) {
        if (typeof value === 'undefined') {
            return translate('validation.required', {field});
        }
    },

    string(value, field) {
        if (typeof value !== 'string') {
            return translate('validation.string', {field});
        }
    },

    min(value, field, opts) {
        if (typeof value === 'string' && value.length < Number(opts[0])) {
            return translate('validation.min.lower', {field});
        }

        if (typeof value === 'number' && value < Number(opts[0])) {
            return translate('validation.min.greater', {field});
        }
    },

    max(value, field, opts) {
        if (typeof value === 'string' && value.length > Number(opts[0])) {
            return translate('validation.max.greater', {field});
        }

        if (typeof value === 'number' && value > Number(opts[0])) {
            return translate('validation.max.lower', {field});
        }
    },

    number(value, field) {
        if (isNaN(value)) {
            return translate('validation.number', {field});
        }
    },

    when(value, key, options, allInput) {
        const [required, field] = options;
        const shouldEqual = field[0] !== '!';

        if (shouldEqual && allInput[required] == field) {
            return allRules.required(...arguments);
        }

        if (!shouldEqual && allInput[required] != field.substring(1, field.length)) {
            return allRules.required(...arguments);
        }
    },

    date(value, field) {
        const isValid = (new Date(value) !== "Invalid Date") && !isNaN(new Date(value));

        if (!isValid) {
            return translate('validation.date', {field});
        }
    }
});

/**
 * Validation function
 * @param translate
 */

const createFieldValidator = translate => {
    let i18nRules = allRules(translate);

    return async (inputValue, inputKey, rules, allInput) => {
        let validations = [];

        if (typeof rules === 'string') {
            const split = rules.split('|');

            validations = split.map(key => {
                const [ruleName, opts = ''] = key.split(':');

                if (!i18nRules[ruleName] || (['when', 'required'].indexOf(ruleName) === -1 && !inputValue)) {
                    return;
                }

                return i18nRules[ruleName](inputValue, inputKey, opts.split(','), allInput);
            });
        }

        if (typeof rules === 'function') {
            validations = [
                async () => {
                    return await rules(inputValue, inputKey);
                }
            ];
        }

        const messages = await Promise.all(validations);
        return messages.filter(message => message !== undefined);
    };
};

/**
 * Validate an object
 * @param translate
 * @returns {Promise<void>}
 */

const createValidator = translate => {
    const fieldValidator = createFieldValidator(translate);

    return async (values, rules) => {
        let valid = true;
        const errors = {};

        for (const key in rules) {
            if (!rules.hasOwnProperty(key)) {
                continue;
            }

            const errorsList = await fieldValidator(values[key], key, rules[key], values);

            if (errorsList.length) {
                errors[key] = errorsList;
                valid = false;
            }
        }

        return valid ? valid : errors;
    };
};

/**
 * Validator plugin
 * @param context
 */

exports.init = context => {
    const {
        db: dbPlugin = false,
        i18n: i18nPlugin = false
    } = context.plugins;

    db = dbPlugin;
    i18n = i18nPlugin;
};

/**
 * Export accessible methods
 * @type {{validate: (function(*, *): {a: string[]})}}
 */

exports.methods = {
    createValidator,
    createFieldValidator,
    build(translate) {
        const validator = createValidator(translate);
        const fieldValidator = createFieldValidator(translate);

        return {
            validate: validator,
            validateField: fieldValidator
        }
    }
};

