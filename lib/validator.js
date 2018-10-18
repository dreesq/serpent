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
     }
};

/**
 * Validation function
 * @param inputValue
 * @param inputKey
 * @param rules
 */

const validate = async (inputValue, inputKey, rules) => {
     const split = rules.split('|');
     const validations = split.map(key => {
          const [ruleName, opts = ''] = key.split(':');

          if (!allRules[ruleName]) {
               return;
          }

          return allRules[ruleName](inputValue, inputKey, opts.split(','));
     });

     console.log(validations);

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

