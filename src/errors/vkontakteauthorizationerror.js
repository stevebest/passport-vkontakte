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
class VkontakteAuthorizationError extends Error {
  constructor (message, type, code, status) {
    super(message)

    this.name = 'VkontakteAuthorizationError'
    this.message = message
    this.type = type
    this.code = code || 'server_error'
    this.status = status || 500
  }
}

/**
 * Expose `VkontakteAuthorizationError`.
 */
module.exports = VkontakteAuthorizationError
