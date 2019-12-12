/**
 * Utils
 */

/**
 * Converts value to string, excluding null, undefined and objects.
 *
 * @param {*} v
 * @returns {*}
 */
exports.stringify = v => ['number', 'string'].includes(typeof v) ? String(v).trim() : v;
