var vows = require('vows');
var assert = require('assert');
var util = require('util');
var vkontakte = require('../');


vows.describe('passport-vkontakte').addBatch({
  
  'module': {
    'should report a version': function (x) {
      assert.isString(vkontakte.version);
    },
  },
  
}).export(module);
