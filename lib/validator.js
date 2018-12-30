let db;
let i18n;

/**
 * Validator rules
 * @type {{}}
 */

const allRules = {
    email(value) {
        const re = /\S+@\S+\.\S+/;

        if (!re.test(value)) {
            return 'validation.email';
        }
    },

    required(value) {
        if (typeof value === 'undefined') {
            return 'validation.required';
        }
    },

    string(value) {
        if (typeof value !== 'string') {
            return 'validation.string';
        }
    },

    min(value, field, opts) {
        if (typeof value === 'string' && value.length < Number(opts[0])) {
            return 'validation.min';
        }

        if (typeof value === 'number' && value < Number(opts[0])) {
            return 'validation.min';
        }
    },

    max(value, field, opts) {
        if (typeof value === 'string' && value.length > Number(opts[0])) {
            return 'validation.max';
        }

        if (typeof value === 'number' && value > Number(opts[0])) {
            return 'validation.max';
        }
    },

    number(value) {
        if (isNaN(value)) {
            return 'validation.number';
        }
    },

    when(value, key, options, allInput) {
        const [required, field] = options;
        const shouldEqual = field[0] !== '!';

        if (shouldEqual && allInput[required] && allInput[required] == field) {
            return allRules.required(...arguments);
        }

        if (!shouldEqual && allInput[required] && allInput[required] != field.substring(1, field.length)) {
            return allRules.required(...arguments);
        }
    },

    async file(value) {
        const items = Array.isArray(value) ? value : [value];
        let invalid = false;

        for (const item of items) {
            if (typeof item !== 'object' || !item.isFile) {
                invalid = true;
            }
        }

        if (invalid) {
            for (const item of items) {
                item.delete && await item.delete();
            }

            return 'validation.file';
        }
    },

    async ext(value, key, options) {
        let invalidFile = await allRules.file(value, key);
        let invalid = false;

        if (invalidFile) {
            return invalidFile;
        }

        const items = Array.isArray(value) ? value : [value];

        for (const item of items) {
            const ext = item.filename.substr(item.filename.lastIndexOf('.') + 1);

            if (options.indexOf(ext) === -1) {
                invalid = true;
            }
        }

        if (invalid) {
            for (const item of items) {
                item.delete && await item.delete();
            }

            return 'validation.extension';
        }
    },

    date(value) {
        const isValid = (new Date(value) !== "Invalid Date") && !isNaN(new Date(value));

        if (!isValid) {
            return 'validation.date';
        }
    }
};


/**
 * Validation function
 * @param inputValue
 * @param inputKey
 * @param rules
 * @param allInput
 * @returns {Promise<any[]>}
 */

const validateField = async (inputValue, inputKey, rules, allInput) => {
    let validations = [];

    if (typeof rules === 'string') {
        const split = rules.split('|');

        validations = split.map(key => {
            const [ruleName, opts = ''] = key.split(':');

            if (!allRules[ruleName] || (['when', 'required'].indexOf(ruleName) === -1 && !inputValue)) {
                return;
            }

            return allRules[ruleName](inputValue, inputKey, opts.split(','), allInput);
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

/**
 * Validate fields
 * @param values
 * @param rules
 * @param validateFunc
 * @returns {Promise<boolean>}
 */

const validate = async (values, rules, validateFunc = validateField) => {
    let valid = true;
    const errors = {};

    for (const key in rules) {
        if (!rules.hasOwnProperty(key)) {
            continue;
        }

        const errorsList = await validateFunc(values[key], key, rules[key], values);

        if (errorsList.length) {
            errors[key] = errorsList;
            valid = false;
        }
    }

    return valid ? valid : errors;
};

/**
 * Attaches a new rule to the validator, note
 * that this allows overwriting rules
 *
 * @param name
 * @param handler
 */

const registerRule = (name, handler) => {
    allRules[name] = handler;
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
    validateField,
    registerRule,
    validate,
    build(translate) {
        return {
            async validate(values, rules) {
                return await validate(values, rules, async (...args) => {
                    return await this.validateField.apply(this, args);
                });
            },
            async validateField(inputValue, inputKey, rules, allInput) {
                const messages = await validateField(inputValue, inputKey, rules, allInput);
                return messages.map(message => translate(message, {}));
            }
        };
    }
};

