/**
 * `VkontakteAPIError` error.
 *
 * @constructor
 * @param {String} [message]
 * @param {Number} [code]
 * @param {Number} [subcode]
 * @api public
 */
function VkontakteAPIError(message, code, status) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'VkontakteAPIError';
  this.message = message;
  this.code = code || 'api_error';
  this.status = status || 500;
}

/**
 * Inherit from `Error`.
 */
VkontakteAPIError.prototype.__proto__ = Error.prototype;


/**
 * Expose `VkontakteAPIError`.
 */
module.exports = VkontakteAPIError;
