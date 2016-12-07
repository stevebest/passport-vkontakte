# Passport-VKontakte

[![Build Status](https://secure.travis-ci.org/stevebest/passport-vkontakte.png)](http://travis-ci.org/stevebest/passport-vkontakte)

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
const VKontakteStrategy = require('passport-vkontakte').Strategy;

// User session support middlewares. Your exact suite might vary depending on your app's needs.
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('express-session')({secret:'keyboard cat', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new VKontakteStrategy(
  {
    clientID:     VKONTAKTE_APP_ID, // VK.com docs call it 'API ID', 'app_id', 'api_id', 'client_id' or 'apiId'
    clientSecret: VKONTAKTE_APP_SECRET,
    callbackURL:  "http://localhost:3000/auth/vkontakte/callback"
  },
  function myVerifyCallbackFn(accessToken, refreshToken, params, profile, done) {

    // Now that we have user's `profile` as seen by VK, we can
    // use it to find corresponding database records on our side.
    // Also we have user's `params` that contains email address (if set in 
    // scope), token lifetime, etc.
    // Here, we have a hypothetical `User` class which does what it says.
    User.findOrCreate({ vkontakteId: profile.id })
        .then(function (user) { done(null, user); })
        .catch(done);
  }
));

// User session support for our hypothetical `user` objects.
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id)
        .then(function (user) { done(null, user); })
        .catch(done);
});
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'vkontakte'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```javascript
//This function will pass callback, scope and request new token
app.get('/auth/vkontakte', passport.authenticate('vkontakte'));

app.get('/auth/vkontakte/callback',
  passport.authenticate('vkontakte', {
    successRedirect: '/',
    failureRedirect: '/login' 
  })
);

app.get('/', function(req, res) {
    //Here you have an access to req.user
    res.json(req.user);
});
```

##### Display Mode

Set `display` in `passport.authenticate()` options to specify display
mode. Refer to the [OAuth dialog
documentation](http://vk.com/dev/auth_mobile)
for information on its usage.


```javascript
app.get('/auth/vkontakte',
  passport.authenticate('vkontakte', { display: 'mobile' }),
  function(req, res){
    // ...
  });
```

#### Extended Permissions

If you need extended permissions from the user, the permissions can be requested
via the `scope` option to `passport.authenticate()`.

For example, this authorization requests permission to the user's friends:

```javascript
app.get('/auth/vkontakte',
  passport.authenticate('vkontakte', { scope: ['status', 'email', 'friends', 'notify'] }),
  function(req, res){
    // The request will be redirected to vk.com for authentication, with
    // extended permissions.
  });
```

#### Profile Fields

The VK.com profile may contain a lot of information.  The
strategy can be configured with a `profileFields` parameter which specifies a
list of additional fields your application needs. For example, to fetch users's `city` and `bdate` configure strategy like this.

Notice that requesting the user's email address requires an `email` access
scope, which you should explicitly list as in following example:

```javascript
passport.use(new VKontakteStrategy(
  {
    // clientID: ..., clientSecret: ..., callbackURL: ...,
    scope: ['email' /* ... and others, if needed */]
    profileFields: ['email', 'city', 'bdate']
  },
  myVerifyCallbackFn
));
```

#### API version

The VK.com profile structure can differ from one API version to another. The specific version to use can be configured with a `apiVersion` parameter. The default is 5.0.

```javascript
passport.use(new VKontakteStrategy(
  {
    // clientID: ..., clientSecret: ..., callbackURL: ...,
    apiVersion: '5.17'
  },
  myVerifyCallbackFn
));
```

## Tests

    $ npm install --dev
    $ make test

## Credits

  - [Jared Hanson](http://github.com/jaredhanson)
  - [Stepan Stolyarov](http://github.com/stevebest)

## Special Thanks

To all the people who had to cope with idiosyncrasies of OAuth2 and VK API!

## License

(The MIT License)

Copyright (c) 2011 Jared Hanson

Copyright (c) 2012, 2016 Stepan Stolyarov

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
