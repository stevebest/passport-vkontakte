/**
 * `VkontakteTokenError` error.
 *
 * VkontakteTokenError represents an error received from a Vkontakte's token
 * endpoint.  Note that these responses don't conform to the OAuth 2.0
 * specification.
 *
 * @constructor
 * @param {String} [message]
 * @param {Number} [code]
 * @param {Number} [status]
 * @api public
 */
function VkontakteTokenError(message, code, status) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'VkontakteTokenError';
  this.message = message;
  this.code = code || 'invalid_request';
  this.status = status || 500;
}

/**
 * Inherit from `Error`.
 */
VkontakteTokenError.prototype.__proto__ = Error.prototype;


/**
 * Expose `VkontakteTokenError`.
 */
module.exports = VkontakteTokenError;
