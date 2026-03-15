/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (size === 0) return '';

  if (!string) return '';

  if (!size) return string;

  let result = string[0];
  let count = 1;

  for (let i = 1; i < string.length; i++) {
    if (string[i] === string[i - 1]) {
      count++;
    } else {
      count = 1;
    }

    if (count <= size) {
      result += string[i];
    }
  }

  return result;
}