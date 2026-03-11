/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
    let newArr = arr.slice();
    const collator = new Intl.Collator(['ru', 'en'], {
        sensitivity: 'case',
        caseFirst: 'upper'
    });
    const direction = param == 'asc' ? 1 : -1;
    newArr.sort((a, b) => collator.compare(a, b) * direction);
    return newArr;
}