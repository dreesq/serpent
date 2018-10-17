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