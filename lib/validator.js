const {toModelName} = require('../utils');

let db;
let i18n;
let axios;
let config;

/**
 * Validator rules
 * @type {{}}
 */

const allRules = {
    email(value) {
        const re = /\S+@\S+\.\S+/;

        if (typeof value !== 'undefined' && !re.test(value)) {
            return 'validation.email';
        }
    },

    required(value) {
        if (typeof value === 'undefined') {
            return 'validation.required';
        }
    },

    string(value) {
        if (typeof value !== 'undefined' && typeof value !== 'string') {
            return 'validation.string';
        }
    },

    array(value) {
        if (!Array.isArray(value)) {
            return 'validation.array';
        }
    },

    min(value, field, opts) {
        if (typeof value === 'undefined') {
            return;
        }

        if (typeof value === 'string' && value.length < Number(opts[0])) {
            return 'validation.min';
        }

        if (typeof value === 'number' && value < Number(opts[0])) {
            return 'validation.min';
        }
    },

    max(value, field, opts) {
        if (typeof value === 'undefined') {
            return;
        }

        if (typeof value === 'string' && value.length > Number(opts[0])) {
            return 'validation.max';
        }

        if (typeof value === 'number' && value > Number(opts[0])) {
            return 'validation.max';
        }
    },

    sameAs(value, field, opts, allInput) {
        if (value !== allInput[opts[0]]) {
            return 'validation.sameAs';
        }
    },

    boolean(value) {
        if (typeof value !== 'undefined' && typeof value !== 'boolean') {
            return 'validation.boolean';
        }
    },

    number(value) {
        if (typeof value !== 'undefined' && typeof value !== 'number') {
            return 'validation.number';
        }
    },

    when(value, key, options, allInput) {
        const [required, field] = options;
        const shouldEqual = field[0] !== '!';

        if (shouldEqual && allInput[required] && allInput[required] == field) {
            return true;
        }

        if (!shouldEqual && allInput[required] && allInput[required] != field.substring(1, field.length)) {
            return true;
        }
    },

    async unique(value, key, options) {
        if (!value) {
            return;
        }

        const [modelName, field = false] = options;
        const model = db[toModelName(modelName)];

        const entry = await model.findOne({ [field]: value });

        if (entry) {
            return 'validation.unique';
        }
    },

    id(value) {
        if (typeof value === 'undefined') {
            return;
        }

        if (typeof value !== 'string' || !value.match(/^[0-9a-fA-F]{24}$/)) {
            return 'validation.id';
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
                item && item.delete && await item.delete();
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

    async gcaptcha(value, key) {
        const {data} = await axios.get('https://www.google.com/recaptcha/api/siteverify', {
            params: {
                response: value,
                secret: config.get('plugins.validator.gcaptcha.secret', '')
            }
        });

        if (!data.success) {
            return 'validation.captcha';
        }
    },

    date(value) {
        if (typeof value === 'undefined') {
            return;
        }

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
    let shouldSkip = false;

    if (typeof rules === 'string') {
        const split = rules.split('|');

        for (const key of split) {
            const [ruleName, opts = ''] = key.split(':');
            let options = opts.split(',');

            if (ruleName === 'when') {
                shouldSkip = !allRules.when(inputValue, inputKey, options, allInput);
                break;
            }

            if (!allRules[ruleName]) {
                continue;
            }

            let message = await allRules[ruleName](inputValue, inputKey, options, allInput);

            if (!message) {
                continue;
            }

            validations.push({
                message,
                options
            });
        }
    }

    if (typeof rules === 'function') {
        let result = await rules(inputValue, allInput);

        if (result) {
            validations = [
                {
                    message: result,
                    options: []
                }
            ]
        }
    }

    if (shouldSkip) {
        return [];
    }

    return validations.filter(error => typeof error !== 'undefined');
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
        i18n: i18nPlugin = false,
        axios: axiosPlugin = false,
        config: configPlugin = false
    } = context.plugins;

    db = dbPlugin;
    i18n = i18nPlugin;
    axios = axiosPlugin;
    config = configPlugin;
};

/**
 * Export accessible methods
 * @type {{validate: (function(*, *): {a: string[]})}}
 */

exports.methods = {
    validateField,
    registerRule,
    validate
};

/**
 * Build on each request
 * @param req
 * @returns {boolean|*[]|{validateField(*=, *=, *=, *=): Promise<*>, validate(*=, *=): Promise<*>}}
 */

exports.build = req => {
    const {translate} = req;

    return {
        async validate(values, rules) {
            return await validate(values, rules, async (...args) => {
                return await this.validateField.apply(this, args);
            });
        },
        async validateField(inputValue, inputKey, rules, allInput) {
            const errors = await validateField(inputValue, inputKey, rules, allInput);

            return errors.map(result => {
                return translate(result.message, {
                    field: inputKey,
                    value: inputValue,
                    options: result.options
                });
            });
        }
    };
};
