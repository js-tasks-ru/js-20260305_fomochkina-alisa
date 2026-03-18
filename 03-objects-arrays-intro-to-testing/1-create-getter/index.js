/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
    let arrKeys = path.split('.');
    return (obj) => arrKeys.reduce((acc, key) => acc && acc.hasOwnProperty(key) ? acc[key] : undefined, obj);
}