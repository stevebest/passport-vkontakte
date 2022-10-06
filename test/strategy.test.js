const assert = require('node:assert')
const nodeUrl = require('node:url')
const vows = require('vows')
const VKontakteStrategy = require('../src/index.js')

vows
  .describe('VKontakteStrategy')
  .addBatch({
    strategy: {
      topic: function () {
        return new VKontakteStrategy(
          {
            clientID: 'ABC123',
            clientSecret: 'secret'
          },
          function () {}
        )
      },

      'should be named vkontakte': function (strategy) {
        assert.equal(strategy.name, 'vkontakte')
      }
    },

    'strategy when loading user profile': {
      topic: function () {
        const strategy = new VKontakteStrategy(
          {
            clientID: 'ABC123',
            clientSecret: 'secret'
          },
          function () {}
        )

        // mock
        strategy._oauth2.getProtectedResource = function (
          url,
          accessToken,
          callback
        ) {
          const body = JSON.stringify({
            response: [
              {
                id: 650715,
                first_name: 'Stepan',
                last_name: 'Stolyarov',
                sex: 2,
                bdate: '1.2.1989',
                photo_123: 'my_photo'
              }
            ]
          })

          callback(null, body, undefined)
        }

        return strategy
      },

      'when told to load user profile': {
        topic: function (strategy) {
          const done = (...args) => this.callback(...args)
          process.nextTick(() => strategy.userProfile('access-token', done))
        },

        'should load profile': function (err, profile) {
          assert.strictEqual(err, null)
          assert.strictEqual(profile.provider, 'vkontakte')
          assert.strictEqual(profile.id, 650715)
          assert.strictEqual(profile.displayName, 'Stepan Stolyarov')
          assert.strictEqual(profile.name.firstName, 'Stepan')
          assert.strictEqual(profile.name.lastName, 'Stolyarov')
          assert.strictEqual(profile.gender, 'male')
        },
        'should set raw property': function (err, profile) {
          assert.strictEqual(err, null)
          assert.strictEqual(typeof profile._raw, 'string')
        },
        'should set json property': function (err, profile) {
          assert.strictEqual(err, null)
          assert.strictEqual(typeof profile._json, 'object')
        },
        'should parse bdate field': function (err, profile) {
          assert.strictEqual(err, null)
          assert.strictEqual(profile.birthday, '1989-02-01')
        },
        'should parse photos': function (err, profile) {
          assert.strictEqual(err, null)
          const photo = profile.photos[0]
          assert.strictEqual(photo.value, 'my_photo')
          assert.strictEqual(photo.type, 'photo_123')
        }
      }
    },

    'strategy when loading user profile with custom fields': {
      topic: function () {
        const self = this

        const strategy = new VKontakteStrategy(
          {
            clientID: 'ABC123',
            clientSecret: 'secret',
            profileFields: ['custom_field_1', 'custom_field_2'],
            apiVersion: '5.110'
          },
          function () {}
        )

        // mock
        strategy._oauth2.getProtectedResource = function (url) {
          const query = nodeUrl.parse(url, true).query
          self.callback(null, query)
        }

        process.nextTick(function () {
          strategy.userProfile('access-token', function () {})
        })
      },

      'should request custom fields': function (err, query) {
        assert.strictEqual(err, null)
        const fields = query.fields.split(',')
        assert.notEqual(fields.indexOf('custom_field_1'), -1)
        assert.notEqual(fields.indexOf('custom_field_2'), -1)
      },
      'should have appropriate version flag in query': function (err, query) {
        assert.strictEqual(err, null)
        assert.equal(query.v, '5.110')
      }
    },

    'strategy when loading user profile and encountering an internal error': {
      topic: function () {
        const strategy = new VKontakteStrategy(
          {
            clientID: 'ABC123',
            clientSecret: 'secret'
          },
          function () {}
        )

        // mock
        strategy._oauth2.getProtectedResource = function (
          url,
          accessToken,
          callback
        ) {
          callback(new Error('something-went-wrong'))
        }

        return strategy
      },

      'when told to load user profile': {
        topic: function (strategy) {
          const self = this
          function done (err, profile) {
            self.callback(err, profile)
          }

          process.nextTick(function () {
            strategy.userProfile('access-token', done)
          })
        },

        'should error': function (err, _) {
          assert.isNotNull(err)
        },
        'should wrap error in InternalOAuthError': function (err, _) {
          assert.equal(err.constructor.name, 'InternalOAuthError')
        },
        'should not load profile': function (err, profile) {
          assert.notStrictEqual(err, null)
          assert.isUndefined(profile)
        }
      }
    },

    'strategy when loading user profile and encountering an api error': {
      topic: function () {
        const strategy = new VKontakteStrategy(
          {
            clientID: 'ABC123',
            clientSecret: 'secret'
          },
          function () {}
        )

        // mock
        strategy._oauth2.getProtectedResource = function (
          url,
          accessToken,
          callback
        ) {
          const body = JSON.stringify({
            error: {
              error_msg: 'Some message',
              error_code: 'some_code'
            }
          })
          callback(null, body)
        }

        return strategy
      },

      'when told to load user profile': {
        topic: function (strategy) {
          const self = this
          function done (err, profile) {
            self.callback(err, profile)
          }

          process.nextTick(function () {
            strategy.userProfile('access-token', done)
          })
        },

        'should error': function (err, _) {
          assert.isNotNull(err)
        },
        'should wrap error in VkontakteAPIError': function (err, _) {
          assert.equal(err.constructor.name, 'VkontakteAPIError')
        },
        'should pass error_msg and error_code': function (err, _) {
          assert.equal(err.message, 'Some message')
          assert.equal(err.code, 'some_code')
        },
        'should not load profile': function (err, profile) {
          assert.notStrictEqual(err, null)
          assert.isUndefined(profile)
        }
      }
    },

    'strategy when encountering token error': {
      topic: function () {
        const strategy = new VKontakteStrategy(
          {
            clientID: 'ABC123',
            clientSecret: 'secret'
          },
          function () {}
        )

        // mock
        strategy._oauth2.getOAuthAccessToken = function (code, opts, callback) {
          const error = new Error()
          error.statusCode = 400
          error.data = JSON.stringify({
            error: {
              error_msg: 'Some message',
              error_code: 'some_code'
            }
          })
          callback(error)
        }

        strategy.error = this.callback.bind(this)

        process.nextTick(function () {
          strategy.authenticate(
            {
              query: {
                code: 'sample code'
              }
            },
            {}
          )
        })
      },

      'should error': function (err, _) {
        assert.isNotNull(err)
      },
      'should wrap error in VkontakteTokenError': function (err, _) {
        assert.equal(err.constructor.name, 'VkontakteTokenError')
      },
      'should pass error_msg and error_code': function (err, _) {
        assert.equal(err.message, 'Some message')
        assert.equal(err.code, 'some_code')
      }
    },

    'strategy when encountering authorization error': {
      topic: function () {
        const strategy = new VKontakteStrategy(
          {
            clientID: 'ABC123',
            clientSecret: 'secret'
          },
          function () {}
        )

        strategy.error = this.callback.bind(this)

        process.nextTick(function () {
          strategy.authenticate(
            {
              query: {
                error: 'some_error',
                error_description: 'Error description'
              }
            },
            {}
          )
        })
      },

      'should error': function (err, _) {
        assert.isNotNull(err)
      },
      'should wrap error in VkontakteAuthorizationError': function (err, _) {
        assert.equal(err.constructor.name, 'AuthorizationError')
      },
      'should pass error_msg and error_code': function (err, _) {
        assert.equal(err.message, 'Error description')
        assert.equal(err.code, 'some_error')
      }
    },

    'strategy when loading authorization url': {
      topic: function () {
        const strategy = new VKontakteStrategy(
          {
            clientID: 'ABC123',
            clientSecret: 'secret'
          },
          function () {}
        )

        return strategy
      },

      'and display not set': {
        topic: function (strategy) {
          const mockRequest = {}
          let url

          // Stub strategy.redirect()
          strategy.redirect = function (location) {
            url = location

            return location
          }
          strategy.authenticate(mockRequest, {})

          return url
        },

        'does not set authorization param': function (url) {
          const params = nodeUrl.parse(url, true).query

          assert.isUndefined(params.display)
        }
      },

      'and display set to mobile': {
        topic: function (strategy) {
          const mockRequest = {}
          let url

          // Stub strategy.redirect()
          strategy.redirect = function (location) {
            url = location

            return location
          }
          strategy.authenticate(mockRequest, { display: 'mobile' })

          return url
        },

        'sets authorization param to mobile': function (url) {
          const params = nodeUrl.parse(url, true).query

          assert.equal(params.display, 'mobile')
        }
      }
    }
  })
  .export(module)
