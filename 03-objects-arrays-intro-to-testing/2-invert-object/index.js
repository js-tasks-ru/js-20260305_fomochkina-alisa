/**
 * invertObj - should swap object keys and values
 * @param {object} obj - the initial object
 * @returns {object | undefined} - returns the new object or undefined if nothing did't pass
 */
export function invertObj(obj) {
    if (!obj) return undefined;
    
    const newObj = {}
    for (const [key, value] of Object.entries(obj)) {
        newObj[value] = key;
    }
    return newObj;
}
