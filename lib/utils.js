/**
 * Helper for getting object value by path
 * @param obj
 * @param path
 * @param defaultValue
 */

exports.get = (obj, path, defaultValue = false) => {
     let value = path.split('.').reduce((a, b) => (a && a.hasOwnProperty(b) ? a[b] : a), obj);
     return (typeof value !== 'undefined' ? value : defaultValue);
};