var vows = require('vows');
var assert = require('assert');
var util = require('util');
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
        var body = '{"response":[{"uid":650715,"first_name":"Stepan","last_name":"Stolyarov","sex":2}]}';
        
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
