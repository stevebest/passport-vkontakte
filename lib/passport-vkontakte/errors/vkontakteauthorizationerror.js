/**
 * `VkontakteAuthorizationError` error.
 *
 * VkontakteAuthorizationError represents an error in response to an
 * authorization request on Vkontakte.  Note that these responses don't conform
 * to the OAuth 2.0 specification.
 *
 * @constructor
 * @param {String} [message]
 * @param {String} [type]
 * @param {String} [code]
 * @param {Number} [status]
 * @api public
 */
function VkontakteAuthorizationError(message, type, code, status) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'VkontakteAuthorizationError';
  this.message = message;
  this.type = type;
  this.code = code || 'server_error';
  this.status = status || 500;
}

/**
 * Inherit from `Error`.
 */
VkontakteAuthorizationError.prototype.__proto__ = Error.prototype;


/**
 * Expose `VkontakteAuthorizationError`.
 */
module.exports = VkontakteAuthorizationError;
