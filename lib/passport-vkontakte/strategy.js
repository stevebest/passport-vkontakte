/**
 * Module dependencies.
 */
var parse = require('./profile').parse
  , util = require('util')
  , url = require('url')
  , OAuth2Strategy = require('passport-oauth2')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * The VK.com authentication strategy authenticates requests by delegating to
 * VK.com using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your VK.com application's App ID
 *   - `clientSecret`  your VK.com application's App Secret
 *   - `callbackURL`   URL to which VK.com will redirect the user after granting authorization
 *   - `profileFields` array of fields to retrieve from VK.com
 *
 * Examples:
 *
 *     passport.use(new VKontakteStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/facebook/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://oauth.vk.com/authorize';
  options.tokenURL = options.tokenURL || 'https://oauth.vk.com/access_token';
  options.scopeSeparator = options.scopeSeparator || ',';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'vkontakte';
  this._profileURL = options.profileURL || 'https://api.vk.com/method/users.get';
  this._profileFields = options.profileFields || [];
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Authenticate request by delegating to a service provider using OAuth 2.0.
 *
 * Since VK.com API is brain-dead and doesn't allow getting user info just
 * by its OAuth access token, this method uses a hack around this limitation.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req, options) {
  options = options || {};

  if (req.query && req.query.error) {
    // TODO: Error information pertaining to OAuth 2.0 flows is encoded in the
    //       query parameters, and should be propagated to the application.
    return this.fail();
  }

  OAuth2Strategy.prototype.authenticate.call(this, req, options);
};


/**
 * Retrieve user profile from Facebook.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `vkontakte`
 *   - `id`               the user's VK.com ID
 *   - `displayName`      the user's full name
 *   - `name.familyName`  the user's last name
 *   - `name.givenName`   the user's first name
 *   - `gender`           the user's gender: `male` or `female`
 *   - `photos`           array of `{ value: 'url' }`
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  var url = this._profileURL;

  var fields = [
    'uid'
  , 'first_name'
  , 'last_name'
  , 'screen_name'
  , 'sex'
  , 'photo'
  ];

  this._profileFields.forEach(function(f) {
    if (fields.indexOf(f) < 0) fields.push(f);
  });

  url += '?fields=' + fields.join(',') + '&v=5.0';

  this._oauth2.getProtectedResource(url, accessToken, function (err, body, res) {
    if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }

    try {
      var json = JSON.parse(body);
      if (json.error) throw new InternalOAuthError('failed to fetch user profile', json.error);
      json = json.response[0];

      var profile = parse(json);
      profile.provider = 'vkontakte';
      profile._raw = body;
      profile._json = json;

      done(null, profile);
    } catch(e) {
      done(e);
    }
  });
}

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
