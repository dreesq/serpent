const crypto = require('crypto');

/**
 * Helper for getting object value by path
 * @param obj
 * @param path
 * @param defaultValue
 */

exports.get = (obj, path, defaultValue = false) => {
     let value = path.split('.').reduce((current, key) => (current && current.hasOwnProperty(key) ? current[key] : undefined), obj);
     return (typeof value !== 'undefined' ? value : defaultValue);
};

/**
 * Helper for creating tokens
 * @param length
 * @returns {Promise<*>}
 */

exports.makeToken = async (length = 32) => {
     return await crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};


/**
 * Error helper
 * @param data
 * @returns {{errors: {message: string[]}}}
 */

exports.error = (data = '') => {
     let res = {
          errors: {
               message: [data]
          }
     };

     if (typeof data === 'object') {
          res.errors = data;
     }

     return res;
};

/**
 * Success helper
 * @param data
 */

exports.success = (data = '') => {
     if (!data) {
          return {
               success: true
          };
     }

     return Array.isArray(data) ? { data } : data;
};