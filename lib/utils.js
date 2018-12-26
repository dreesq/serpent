const crypto = require('crypto');
const {promisify} = require('util');
const fs = require('fs');
const path = require('path');

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

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

/**
 * Helper function for loading folder
 * @param appPath
 * @param type
 * @param callback
 * @returns {Promise<void>}
 */

exports.load = async (appPath = '.', type = 'actions', callback = false) => {
    const actions = await readdir(path.join(appPath, `./${type}`));

    for (const action of actions) {
        let actionPath = path.join(appPath, `./${type}`, action);
        let itemStat = await stat(actionPath);

        if (!itemStat.isFile()) {
            continue;
        }

        const required = require(`${appPath === '.' ? '../' : ''}${actionPath}`);

        if (callback) {
            callback(action, required);
        }
    }
};