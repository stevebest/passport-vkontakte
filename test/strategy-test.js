var vows = require('vows');
var assert = require('assert');
var util = require('util');
var urlParser = require('url');
var VKontakteStrategy = require('passport-vkontakte/strategy');


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
      }

      return strategy;
    },

    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }

        process.nextTick(function () {
          strategy.userProfile('access-token', 650715, done);
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
        profileFields: ['custom_field_1', 'custom_field_2']
      },
      function() {});

      // mock
      strategy._oauth2.getProtectedResource = function(url, accessToken, callback) {
        var query = urlParser.parse(url, true).query;
        self.callback(null, query);
      }

      process.nextTick(function () {
        strategy.userProfile('access-token', 650715, function() {});
      });
    },

    'should request custom fields' : function(err, query) {
      var foelds = query.fields.split(',');
      assert.notEqual(foelds.indexOf('custom_field_1'), -1);
      assert.notEqual(foelds.indexOf('custom_field_2'), -1);
    },
    'should have version flag in query' : function(err, query) {
      assert.equal(query.v, '5.0');
    },
  },

  'strategy when loading user profile and encountering an error': {
    topic: function() {
      var strategy = new VKontakteStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});

      // mock
      strategy._oauth2.getProtectedResource = function(url, accessToken, callback) {
        callback(new Error('something-went-wrong'));
      }

      return strategy;
    },

    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }

        process.nextTick(function () {
          strategy.userProfile('access-token', 650715, done);
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

}).export(module);
