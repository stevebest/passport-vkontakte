# Passport-VKontakte

[![Build Status](https://secure.travis-ci.org/stevebest/passport-vkontakte.png)][travis-build-status]

[Passport][passport-js] strategy for authenticating with [VK][vk] using the OAuth 2.0 API.

This module lets you authenticate using VK in your Node.js applications.
By plugging into Passport, VK authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect][connect]-style middleware, including [Express][express].

## Installation

    $ npm install passport-vkontakte

## Usage

### Configure Strategy

Using this strategy, you can authenticate users who have a VK account and
access their data, given their access permission.

In order to be used, a strategy must be configured with two parameters.

```javascript
import Strategy as VKStrategy from "passport-vkontakte";
passport.use(new VKStrategy(options, verify));
```

| Parameter | Type     | Desciption                       |
| --------- | -------- | -------------------------------- |
| `options` | object   | App credentials and callback URL |
| `verify`  | function | Strategy verification callback   |

#### Strategy options

The `options` objects provides the strategy with the information it needs to
represent your app to VK API. It includes your app credentials (application id
and secret), as well as the callback URL to which the user will be redirected
after they complete the authentication process.

| Field           | Type       | Description                                                     |
| --------------- | ---------- | --------------------------------------------------------------- |
| `clientID`      | **string** | Your app's client id                                            |
| `clientSecret`  | **string** | Your app's secret                                               |
| `callbackURL`   | **string** | The full URL to your authentication completion handler          |
| `profileFields` | array      | A list of profile fields                                        |
| `apiVersion`    | string     | The version of VK API implementation                            |
| `lang`          | string     | The language which should be used to represent the profile data |

#### Strategy `verify` callback

A `verify` callback function is called after resource owner (the user) has
accepted or declined the authorization request. In the example below, this
function is called `myVerifyCallbackFn`.

It can have one of four signatures:

```javascript
function(accessToken, refreshToken, profile, done) {}
function(accessToken, refreshToken, params, profile, done) {}
function(req, accessToken, refreshToken, params, profile, done) {}
```

| Parameter      | Type     | Description                                  |
| -------------- | -------- | -------------------------------------------- |
| `req`          | object   |                                              |
| `accessToken`  | string   | [OAuth2 access token][oauth2-access-token]   |
| `refreshToken` | string   | [OAuth2 refresh token][oauth2-refresh-token] |
| `params`       | object   |                                              |
| `profile`      | object   | User profile                                 |
| `done`         | function | "Done" callback                              |

The `verify` function can use the `profile` and `params` fields to find, create
or update any kind of information that corresponds to now authenticated user.

After the user has been successfully authenticated, the `done` function should
be called, to supply Passport with the `user` data as seen by the application.

```javascript
return done(null, user);
```

In case of authentication error, `false` should be supplied instead.

```javascript
return done(null, false);
```

Additional `info` object can be provided to indicate the reason for failure.

```javascript
return done(null, false, { message: "User account is suspended" });
```

For transient errors, pass the error object as the first parameter.

```javascript
return done(new Error("User database is not available, try later"));
```

```javascript
const VKontakteStrategy = require("passport-vkontakte").Strategy;

// User session support middlewares. Your exact suite might vary depending on your app's needs.
app.use(require("cookie-parser")());
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(
    require("express-session")({
        secret: "keyboard cat",
        resave: true,
        saveUninitialized: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new VKontakteStrategy(
        {
            clientID: VKONTAKTE_APP_ID, // VK.com docs call it 'API ID', 'app_id', 'api_id', 'client_id' or 'apiId'
            clientSecret: VKONTAKTE_APP_SECRET,
            callbackURL: "http://localhost:3000/auth/vkontakte/callback",
        },
        function myVerifyCallbackFn(
            accessToken,
            refreshToken,
            params,
            profile,
            done
        ) {
            // Now that we have user's `profile` as seen by VK, we can
            // use it to find corresponding database records on our side.
            // Also we have user's `params` that contains email address (if set in
            // scope), token lifetime, etc.
            // Here, we have a hypothetical `User` class which does what it says.
            User.findOrCreate({ vkontakteId: profile.id })
                .then(function (user) {
                    done(null, user);
                })
                .catch(done);
        }
    )
);

// User session support for our hypothetical `user` objects.
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id)
        .then(function (user) {
            done(null, user);
        })
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
app.get("/auth/vkontakte", passport.authenticate("vkontakte"));

app.get(
    "/auth/vkontakte/callback",
    passport.authenticate("vkontakte", {
        successRedirect: "/",
        failureRedirect: "/login",
    })
);

app.get("/", function (req, res) {
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
app.get(
    "/auth/vkontakte",
    passport.authenticate("vkontakte", { display: "mobile" }),
    function (req, res) {
        // ...
    }
);
```

#### Extended Permissions

If you need extended permissions from the user, the permissions can be requested
via the `scope` option to `passport.authenticate()`.

For example, this authorization requests permission to the user's friends:

```javascript
app.get(
    "/auth/vkontakte",
    passport.authenticate("vkontakte", {
        scope: ["status", "email", "friends", "notify"],
    }),
    function (req, res) {
        // The request will be redirected to vk.com for authentication, with
        // extended permissions.
    }
);
```

#### Profile Fields

The VK.com profile may contain a lot of information. The
strategy can be configured with a `profileFields` parameter which specifies a
list of additional fields your application needs. For example, to fetch users's `city` and `bdate` configure strategy like this.

Notice that requesting the user's email address requires an `email` access
scope, which you should explicitly list as in following example:

```javascript
passport.use(
    new VKontakteStrategy(
        {
            ...{ clientID, clientSecret, callbackURL },
            scope: ["email" /* ... and others, if needed */],
            profileFields: ["email", "city", "bdate"],
        },
        myVerifyCallbackFn
    )
);
```

#### Profile fields language

By default, profile fields such as name are returned in English. The strategy can be
configured with a `lang` parameter which specifies language of value returned.

For example, this would configure the strategy to return name in Russian:

```javascript
passport.use(
    new VkontakteStrategy(
        {
            ...{ clientID, clientSecret, callbackURL },
            lang: "ru",
        },
        myVerifyCallbackFn
    )
);
```

#### API version

The VK.com profile structure can differ from one API version to another. The specific version to use can be configured with a `apiVersion` parameter. The default is `5.110`.

```javascript
passport.use(
    new VKontakteStrategy(
        {
            ...{ clientID, clientSecret, callbackURL },
            apiVersion: "5.17",
        },
        myVerifyCallbackFn
    )
);
```

## Tests

    $ npm install --dev
    $ make test

## Credits

-   [Jared Hanson](http://github.com/jaredhanson)
-   [Stepan Stolyarov](http://github.com/stevebest)

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

[passport-js]: http://passportjs.org/
[vk]: https://www.vk.com/
[connect]: http://www.senchalabs.org/connect/
[express]: http://expressjs.com/
[travis-build-status]: http://travis-ci.org/stevebest/passport-vkontakte
[oauth2-access-token]: https://tools.ietf.org/html/rfc6749#section-1.4
[oauth2-refresh-token]: https://tools.ietf.org/html/rfc6749#section-1.5
