/**
 * `VkontakteAPIError` error.
 *
 * @constructor
 * @param {string} [message]
 * @param {number} [code]
 * @param {number} [status]
 * @api public
 */
class VkontakteAPIError extends Error {
  constructor (message, code, status) {
    super(message)

    this.name = 'VkontakteAPIError'
    this.message = message
    this.code = code || 'api_error'
    this.status = status || 500
  }
}

/**
 * Expose `VkontakteAPIError`.
 */
module.exports = VkontakteAPIError
