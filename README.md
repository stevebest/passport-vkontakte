# Passport-VKontakte

[Passport](http://passportjs.org/) strategy for authenticating with [VK.com](http://www.vk.com/)
using the OAuth 2.0 API.

This module lets you authenticate using VK.com in your Node.js applications.
By plugging into Passport, VK.com authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Installation

    $ npm install passport-vkontakte

## Usage

#### Configure Strategy

The VK.com authentication strategy authenticates users using a VK.com
account and OAuth 2.0 tokens.  The strategy requires a `verify` callback, which
accepts these credentials and calls `done` providing a user, as well as
`options` specifying a app ID, app secret, and callback URL.

```javascript
passport.use(new VKontakteStrategy({
    clientID:     VKONTAKTE_APP_ID, // VK.com docs call it 'API ID'
    clientSecret: VKONTAKTE_APP_SECRET,
    callbackURL:  "http://localhost:3000/auth/vkontakte/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ vkontakteId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'vkontakte'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```javascript
app.get('/auth/vkontakte',
  passport.authenticate('vkontakte'),
  function(req, res){
    // The request will be redirected to vk.com for authentication, so
    // this function will not be called.
  });

app.get('/auth/vkontakte/callback',
  passport.authenticate('vkontakte', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
```

##### Display Mode

Set `display` in `passport.authenticate()` options to specify display
mode. Refer to the [OAuth dialog
documentation](http://vk.com/dev/auth_mobile)
for information on its usage.

    app.get('/auth/vkontakte',
      passport.authenticate('vkontakte', { display: 'mobile' }),
      function(req, res){
        // ...
      });

#### Extended Permissions

If you need extended permissions from the user, the permissions can be requested
via the `scope` option to `passport.authenticate()`.

For example, this authorization requests permission to the user's friends:

```javascript
app.get('/auth/vkontakte',
  passport.authenticate('vkontakte', { scope: ['friends'] }),
  function(req, res){
    // The request will be redirected to vk.com for authentication, with
    // extended permissions.
  });
```

#### Profile Fields

The VK.com profile may contain a lot of information.  The
strategy can be configured with a `profileFields` parameter which specifies a
list of additional fields your application needs. For example, to fetch users's `city` and `bdate` configure strategy like this.

    passport.use(new VKontakteStrategy({
        // clientID, clientSecret and callbackURL
        profileFields: ['city', bdate']
      },
      // verify callback
    ));

## Tests

    $ npm install --dev
    $ make test

[![Build Status](https://secure.travis-ci.org/stevebest/passport-vkontakte.png)](http://travis-ci.org/stevebest/passport-vkontakte)

## Credits

  - [Jared Hanson](http://github.com/jaredhanson)
  - [Stepan Stolyarov](http://github.com/stevebest)

## License

(The MIT License)

Copyright (c) 2011 Jared Hanson

Copyright (c) 2012 Stepan Stolyarov

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
