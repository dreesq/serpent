let db;
let i18n;

/**
 * Validator rules
 * @type {{}}
 */

const allRules = {
     required(value, key, opts) {
          if (typeof value === 'undefined') {
               return `Field ${key} is required.`;
          }
     },

     string(value, key) {
          if (typeof value !== 'string') {
               return `Field ${key} is not a string.`;
          }
     },

     min(value, key, opts) {
          if (value < Number(opts[0])) {
               return `Field ${key} requires a higher value.`;
          }
     },

     max(value, key, opts) {
          if (value > Number(opts[0])) {
               return `Field ${key} requires a lower value.`;
          }
     },

     number(value, key) {
          if (isNaN(value)) {
               return `Field ${key} is not a number.`;
          }
     },

     date(value, key) {
          const isValid = (new Date(value) !== "Invalid Date") && !isNaN(new Date(value));

          if (!isValid) {
               return `Field ${key} is not a valid date.`;
          }
     }
};

/**
 * Validation function
 * @param inputValue
 * @param inputKey
 * @param rules
 */

const validate = async (inputValue, inputKey, rules) => {
     let validations = [];

     if (typeof rules === 'string') {
          const split = rules.split('|');
          validations = split.map(key => {
               const [ruleName, opts = ''] = key.split(':');

               if (!allRules[ruleName] || (ruleName !== 'required' && !inputValue)) {
                    return;
               }

               return allRules[ruleName](inputValue, inputKey, opts.split(','));
          });
     }

     if (typeof rules === 'function') {
          validations = [rules];
     }

     const messages = await Promise.all(validations);
     return messages.filter(message => message !== undefined);
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
     validate
};

