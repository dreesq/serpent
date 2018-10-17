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
          if (allRules[key]) {
               return allRules[key](inputValue, inputKey, key.split(','));
          }
     });

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

