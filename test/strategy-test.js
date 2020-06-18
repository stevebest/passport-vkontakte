var vows = require('vows');
var assert = require('assert');
var util = require('util');
var urlParser = require('url');
var VKontakteStrategy = require('../').Strategy;

vows.describe('VKontakteStrategy').addBatch({

  'strategy': {
    topic: function() {
      return new VKontakteStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
    },

    'should be named vkontakte': function (strategy) {
      assert.equal(strategy.name, 'vkontakte');
    },
  },

  'strategy when loading user profile': {
    topic: function() {
      var strategy = new VKontakteStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});

      // mock
      strategy._oauth2.getProtectedResource = function(url, accessToken, callback) {
        var body = JSON.stringify({
          response: [{
            id: 650715,
            first_name: "Stepan",
            last_name: "Stolyarov",
            sex: 2,
            bdate: "1.2.1989",
            photo_123: "my_photo"
          }]
        });

        callback(null, body, undefined);
      };

      return strategy;
    },

    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }

        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },

      'should not error' : function(err, req) {
        assert.isNull(err);
      },
      'should load profile' : function(err, profile) {
        assert.equal(profile.provider, 'vkontakte');
        assert.equal(profile.id, '650715');
        assert.equal(profile.displayName, 'Stepan Stolyarov');
        assert.equal(profile.name.givenName, 'Stepan');
        assert.equal(profile.name.familyName, 'Stolyarov');
        assert.equal(profile.gender, 'male');
      },
      'should set raw property' : function(err, profile) {
        assert.isString(profile._raw);
      },
      'should set json property' : function(err, profile) {
        assert.isObject(profile._json);
      },
      'should parse bdate field' : function(err, profile) {
        assert.equal(profile.birthday, '1989-02-01');
      },
      'should parse photos' : function(err, profile) {
        var photo = profile.photos[0];
        assert.equal(photo.value, 'my_photo');
        assert.equal(photo.type, 'photo_123');
      },
    },
  },

  'strategy when loading user profile with custom fields': {
    topic: function() {
      var self = this;

      var strategy = new VKontakteStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret',
        profileFields: ['custom_field_1', 'custom_field_2'],
        apiVersion: '5.110'
      },
      function() {});

      // mock
      strategy._oauth2.getProtectedResource = function(url, accessToken, callback) {
        var query = urlParser.parse(url, true).query;
        self.callback(null, query);
      };

      process.nextTick(function () {
        strategy.userProfile('access-token', function() {});
      });
    },

    'should request custom fields' : function(err, query) {
      var foelds = query.fields.split(',');
      assert.notEqual(foelds.indexOf('custom_field_1'), -1);
      assert.notEqual(foelds.indexOf('custom_field_2'), -1);
    },
    'should have appropriate version flag in query' : function(err, query) {
      assert.equal(query.v, '5.110');
    },
  },

  'strategy when loading user profile and encountering an internal error': {
    topic: function() {
      var strategy = new VKontakteStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});

      // mock
      strategy._oauth2.getProtectedResource = function(url, accessToken, callback) {
        callback(new Error('something-went-wrong'));
      };

      return strategy;
    },

    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }

        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },

      'should error' : function(err, req) {
        assert.isNotNull(err);
      },
      'should wrap error in InternalOAuthError' : function(err, req) {
        assert.equal(err.constructor.name, 'InternalOAuthError');
      },
      'should not load profile' : function(err, profile) {
        assert.isUndefined(profile);
      },
    },
  },

  'strategy when loading user profile and encountering an api error': {
    topic: function() {
      var strategy = new VKontakteStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});

      // mock
      strategy._oauth2.getProtectedResource = function(url, accessToken, callback) {
        var body = JSON.stringify({
          error: {
            error_msg: 'Some message',
            error_code: 'some_code'
          }
        });
        callback(null, body);
      };

      return strategy;
    },

    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }

        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },

      'should error' : function(err, req) {
        assert.isNotNull(err);
      },
      'should wrap error in VkontakteAPIError' : function(err, req) {
        assert.equal(err.constructor.name, 'VkontakteAPIError');
      },
      'should pass error_msg and error_code' : function(err, req) {
        assert.equal(err.message, 'Some message');
        assert.equal(err.code, 'some_code');
      },
      'should not load profile' : function(err, profile) {
        assert.isUndefined(profile);
      },
    },
  },

  'strategy when encountering token error': {
    topic: function() {
      var strategy = new VKontakteStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});

      // mock
      strategy._oauth2.getOAuthAccessToken = function(code, opts, callback) {
        var error = new Error();
        error.statusCode = 400;
        error.data = JSON.stringify({
          error: {
            error_msg: 'Some message',
            error_code: 'some_code'
          }
        });
        callback(error);
      };

      strategy.error = this.callback.bind(this);

      process.nextTick(function () {
        strategy.authenticate({
          query: {
            code: 'sample code'
          }
        });
      });
    },

    'should error' : function(err, req) {
      assert.isNotNull(err);
    },
    'should wrap error in VkontakteTokenError' : function(err, req) {
      assert.equal(err.constructor.name, 'VkontakteTokenError');
    },
    'should pass error_msg and error_code' : function(err, req) {
      assert.equal(err.message, 'Some message');
      assert.equal(err.code, 'some_code');
    },
  },

  'strategy when encountering authorization error': {
    topic: function() {
      var strategy = new VKontakteStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});

      strategy.error = this.callback.bind(this);

      process.nextTick(function () {
        strategy.authenticate({
          query: {
            error: 'some_error',
            error_description: 'Error description'
          }
        });
      });
    },

    'should error' : function(err, req) {
      assert.isNotNull(err);
    },
    'should wrap error in VkontakteAuthorizationError' : function(err, req) {
      assert.equal(err.constructor.name, 'AuthorizationError');
    },
    'should pass error_msg and error_code' : function(err, req) {
      assert.equal(err.message, 'Error description');
      assert.equal(err.code, 'some_error');
    },
  },

  'strategy when loading authorization url': {
    topic: function () {
      var strategy = new VKontakteStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});

      return strategy;
    },

    'and display not set': {
      topic: function (strategy) {
        var mockRequest = {},
            url;

        // Stub strategy.redirect()
        strategy.redirect = function (location) {
          url = location;

          return location;
        };
        strategy.authenticate(mockRequest);

        return url;
      },

      'does not set authorization param': function(url) {
        var params = urlParser.parse(url, true).query;

        assert.isUndefined(params.display);
      }
    },

    'and display set to mobile': {
      topic: function (strategy) {
        var mockRequest = {},
            url;

        // Stub strategy.redirect()
        strategy.redirect = function (location) {
          url = location;

          return location;
        };
        strategy.authenticate(mockRequest, { display: 'mobile' });

        return url;
      },

      'sets authorization param to mobile': function(url) {
        var params = urlParser.parse(url, true).query;

        assert.equal(params.display, 'mobile');
      }
    }
  },
}).export(module);
