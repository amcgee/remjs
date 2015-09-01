# REM

[![npm version](https://badge.fury.io/js/remjs.svg)](http://badge.fury.io/js/remjs)
[![stability](https://img.shields.io/badge/stability-alpha-orange.svg?style=flat)](https://remjs.org)

[![Build Status](https://travis-ci.org/amcgee/remjs.svg)](https://travis-ci.org/amcgee/remjs)
[![Coverage Status](https://coveralls.io/repos/amcgee/remjs/badge.svg)](https://coveralls.io/r/amcgee/remjs)
[![Code Climate](https://codeclimate.com/github/amcgee/remjs/badges/gpa.svg)](https://codeclimate.com/github/amcgee/remjs)
[![Dependencies](https://david-dm.org/amcgee/remjs.svg)](https://david-dm.org/amcgee/remjs)

Rapid Eye Movement (REM) : A dead-simple REST API framework for NodeJS.  Now go back to sleep, you were having a good dream.

This library is not yet fit for production use, but is steadily marching in that direction.  It is being developed to support [WellDone](https://www.welldone.org)'s management and data analytics portal.  Want to help out?  [Contact me](https://austinmcgee.net/contact) or just dive in.

Currently, only NeDB and a subset of MongoDB are supported backend engines, but more will be introduced soon.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
  - [Resources](#resources)
  - [Modifiers](#modifiers)
    - [fields](#fields)
    - [sort](#sort)
    - [limit](#limit)
    - [skip](#skip)
  - [Authentication](#authentication)
    - [Anonymous access](#anonymous-access)
    - [Login](#login)
    - [Authenticated Requests](#authenticated-requests)
    - [Signup](#signup)
    - [/Me](#me)
    - [Authentication Options](#authentication-options)
- [Utilities](#utilities)
  - [REM Server](#rem-server)
    - [REM.serve](#remserve)
- [Other fun stuff](#other-fun-stuff)
  - [Contributing](#contributing)
    - [Tests](#tests)
  - [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Installation

Prerequisites:

- [NodeJS](http://www.nodejs.org)
- [npm](http://www.npmjs.org)

Install your favorite database, currently supported: 

- [NeDB](https://github.com/louischatriot/nedb) for local data storage
- [MongoDB](http://www.mongodb.org/) for more robust, production-grade use cases
- *More coming soon, including various flavors of SQL by way of [knex](http://knexjs.org/)!*

Now, install [remjs](http://npmjs.org/package/remjs) via [npm](http://npmjs.org)
```shell
npm install remjs
```

## Basic Usage

A simple example using the [REM.serve](#utilities-rem-server-remserve) utility function and [NeDB](https://github.com/louischatriot/nedb) for local data storage
```javascript
var REM = require('remjs');

var options = {
    dataDirectory: "./data/simple_example",
    version: "1.0",
    resources: {
        'employees': {},
        'departments': {
            children: ['employees']
        }
    }
}

REM.serve( options );
```

That's it!

The important part is the options hash, which supports the following ([REM.Server](#utilities-rem-server) and [REM.serve](#utilities-rem-server-remserve) extensions excluded):

- *version* : The version to expose at `/_version`, useful if you're serving multiple REM versions.
- *engine* : The database engine to use.  This should be a hash with a MongoDB-style accessor object for each resource.
- *resources* : This is the meat and potatoes of the whole meal.  Each key in the resources has becomes a REST API collection, and there are various options you can specify for each one (more details forthcoming)

Try it!
```shell
git clone https://github.com/amcgee/remjs.git
cd remjs
npm install
node examples/simple_example.js
```

Now, you can interact with your new API however you please.  The following examples assume [cURL](http://curl.haxx.se/), [jq](http://stedolan.github.io/jq/) for JSON parsing, and basic linux terminal familiarity.

First, get the list of available resources at `_help`
```shell
curl http://localhost:3000/api/_help | jq '.'
[
  "employees",
  "departments"
]
```

Now, try getting the entire collection at `/departments` (it's empty)
```shell
curl http://localhost:3000/api/departments | jq '.'
[]
```

Ok, now let's POST a new department to that resource.  (Your `_id` will be different)
```shell
curl -H "Content-Type: application/json" -d '{"name":"TPSReportDepartment","purpose":"NONE"}' \
    http://localhost:3000/api/departments | jq '.'
{
  "name": "TPSReportDepartment",
  "purpose": "NONE",
  "_id": "9QWrPtnkK63Hb0WF"
}
```

Great, now let's make sure it showed up.
```shell
curl http://localhost:3000/api/departments | jq '.'
[
  {
    "name": "TPSReportDepartment",
    "purpose": "NONE",
    "_id": "9QWrPtnkK63Hb0WF"
  }
]
```

OK, now let's save off the new department's ID (or you could do this manually).
```shell
DPTID=`curl http://localhost:3000/api/departments | jq '.[0]._id' | sed -e 's/^"//'  -e 's/"$//'`
```

Use that ID to get the individual department
```shell
curl http://localhost:3000/api/departments/$DPTID | jq '.'
{
  "name": "TPSReportDepartment",
  "purpose": "NONE",
  "_id": "9QWrPtnkK63Hb0WF"
}
```

Get the list of employees in the new department (currently empty)
```shell
curl http://localhost:3000/api/departments/$DPTID/employees | jq '.'
[]
```

Make it not empty.
```shell
curl -H "Content-Type: application/json" -d '{"name":"Joe Schmoe","salary":250}' \
    http://localhost:3000/api/departments/$DPTID/employees | jq '.'
{
  "departments_id": "9QWrPtnkK63Hb0WF",
  "name": "Joe Schmoe",
  "salary": 250,
  "_id": "tGmX6t8G6rha8ma4"
}
```

Get the non-empty list.
```shell
curl http://localhost:3000/api/departments/$DPTID/employees | jq '.'
[
    {
      "departments_id": "9QWrPtnkK63Hb0WF",
      "name": "Joe Schmoe",
      "salary": 250,
      "_id": "tGmX6t8G6rha8ma4"
    }
]
```

Profit.

## Resources

At the heart of any REM configuration is a set of resources.  These are effectively the top-level collections in the data model.  Available REM options (which can also be specified at the top REM options level and will be inherited by sub-collections) are:

- `engine`: The backend database engine
- `id_key`: (partial support only) Specify the property to use as the canonical ID reference for this resource.  Default: `_id`, changing this may break things.
- `private`: If set to `true`, this resoure will not be exposed at this location by the REST API.  The resource could still be exposed as a child or another resource, or used as an authentication user store.
- `children`: The children of a particular resource.  This is effectively a `has-many` relationship.
- `forbid`: The actions to forbid on this resource.  For instance, you can specify `fobid: ['post']` on a top-level resource to prevent users from POST-ing without going through a parent object (i.e. you can only create new employees within a department)
- `filter`: The base filter to apply to all queries to the backend DB.
- `defaults`: The default values to use when generating new documents within this resource.
- `immutable_keys`: The set of keys that cannot be set or modified by an API user.  This can be useful when used in combination with `defaults`
- `makeForeignKey`: A function used to name foreign-key properties that point to this resource.  Default: `function(target) { return target + "_id" }`

## Modifiers

The following can be added to the query string of a URL to modify or limit the results.  They modify the resulting database query, so the server doesn't need to do the processing.

### fields

Return only certain fields in the response.  This is a comma-delimeted list

For instance, only include the employee names with `fields=name`

```
GET /employees?fields=name
```

Or the name and salary of a particular employee with `fields=name,salary`

```
GET /employees/<id>?fields=name,salary
```

*NOTE*: the id is also stripped by default, to include it add `_id` as a field parameter

### sort

Sort the results by the fields listed in the comma-delimited `sort` perameter.  Pre-pend a `-` to the field name to sort in reverse order.

The database engine determines the sorting heuristics.

Sort by salary (ascending), then by title (descending)

```
GET /employees?sort=salary,-title
```


### limit

Only return the first `N` results with `?limit=N`, useful for pagination.

i.e. get the top 3 highest-paid employees

```
GET /employees?sort=-salary&limit=3
```

### skip

Skip the first `N` results with `?skip=N`, useful for pagination.

i.e. return the fourth, fifth, and sixth highest-paid employees

```
GET /employees?sort=-salary&limit=3&skip=3
```

## Authentication
REM can easily be configured to perform user authentication and session management (using JSON Web Tokens, so no actual session state is needed on the server).  To enable authentication, simply supply an `authentication` property to your REM options.

```javascript
var REM = require('../');

var options = {
    dataDirectory: "./data/authentication_example",
    version: "1.0",
    authentication: {
      annonymous_signup: true,
      login_authority: {
        resource: 'employees'
      }
    },
    resources: {
        'employees': {},
        'departments': {
            children: ['employees']
        }
    }
}

REM.serve( options );
```

In this example, we specify `employees` as the authentication login authority.  This allows employees to log in (assuming they've been added to the login system correctly, see [signup](#rem-authentication-signup) below).  In this example we also allow anyone to sign up as an employee, which probably isn't a good way to run a business.

### Anonymous access

Once authentication has been configured, un-authenticated users will always receive an `HTTP 401` error when accessing any REM resource.  The two notable exceptions are the [login](#rem-authentication-login) and [signup](#rem-authentication-signup) endpoints described in the following sections.

### Login

Assuming a user has been created and a password assigned, logging in is simple.

```shell
curl -d '{"login": "joseph","password": "MyP4SSW0RD!"}' http://localhost:3000/_login
```

If authentication fails because the login or password are incorrect, the REM server replies with an HTTP 400 error.  If it succeeds, the server replies with an HTTP 200 OK and the body of the response is the new JSON Web Token which can be used to make authenticated requests.  A JSON web token looks like a bunch of random text:

```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6eyJ1c2VybmFtZSI6ImF1c3RpbiIsIl9pZC
I6InNBajBzbnIzaHF3MjNob0oifSwiaWF0IjoxNDE2ODc1MDEwLjc5OCwiZXhwIjoxNDE2ODc2ODEwL
jc5OH0.18gIxEhLpBuLnkiwBJbAWpEb-uQesH1E5q0dBa35Hqo
```

but it encodes the following:

- The identity of the logged-in user
- An expiration time for the token (enforced server-side)

### Authenticated Requests
To make authenticated requests, include the JWT token as a Bearer token in the `Authorization` HTTP header, like so (assuming the token has been saved in the TOKEN environment variable):

```shell
curl -H "Authorization:Bearer $TOKEN" http://localhost:3000/departments
```

### Signup
If `options.authentication.annonymous_signup` is set to `true`, REM will allow unauthenticated POST requests to `signup_path` (`/_signup` by default) to create new user accounts.  There is currently no spam protection or rate limiting on this endpoint, so use `annonymous_signup` with caution.

### /Me
Once a user has authenticated, the underlying user resource is exposed via the `/me` shortcut path.  This is a direct alias to the user resource, so if `login_authority.resource` is `users` and the logged-in user has ID `Om77wPVRTJWZSjNf`, the `/me` will return the same result as `/users/Om77wPVRTJWZSjNf`.

Additionally, the following actions are available under the `/me` namespace:

- `POST /me/_password`: Change the current user's password.  Requires a JSON-formatted body with `old_password` and `new_password` specified.  Return `200 OK` on success.
- `DELETE /me/_password`: Reset the current user's password to something random.  Requires a JSON-formatted body with `old_password` specified.  Returns `200 OK` with the user's newly-generated password as the response body.

### Authentication Options
The following are options available in the `options.authentication` object:

```javascript
var rem_options = {
  authentication: {
    login_path: '/_login',
    signup_path: '/_signup',
    me_path: '/me',
    annonymous_signup: false,
    login_authority: {
      type: 'basic',
      resource: 'users',
      login_property: 'username',
      auth_property: '_auth',

    },
    password_min_length: 6,
    password_key_length: 64,
    password_salt_size: 64,
    password_pbkdf2_iterations: 10000,
    token_expiration_minutes: 30,
    jwt_secret: 'THISISATOPSECRETVALUETHATSHOULDBEUNGUESSABLEANDNEVERSHARED'
  }
  ...
})
```

- `login_path`: The path at which to listen for logins.  Default: `/_login`
- `signup_path`: The path at which to listen for new signups.  Does nothing if `annonymous_signup` is not set to `true`.  Default: `/_signup`
- `me_path`: The path at which to expose data about the currently logged in user.  Default: `/me`
- `annonymous_signup`: set to `true` if annonymous users are allowed to create new accounts by posting a login and password to the `signup_path`.  Default: `false` 
- `login_authority.resource`: The resource to use as the user store.  It must already exist.  Default: `users`
- `login_authority.login_property`: The property of the login authority resource to use when looking up login names.  Must be unique.  Default: `username`
- `login_authority.type`: The type of login authority.  Currently, the only available type is `basic`, also the default.
- `login_authority.auth_property`: The property of the login authority resource to use when storing sensitive login information (namely the encrypted password, password salt, and number of pbkdf2 iterations.  Must begin with an `_` so it is never exposed by the API itself.  Default: `_auth`
- `password_min_length`: The minimum character length of new passwords.  Default: `6`
- `password_key_length`: (ADVANCED) The size to use when generating an encrypted password using pbkdf2.  Default: `64`
- `password_salt_size`: (ADVANCED) The size to use when generating a password salt to use during pbkdf2 encryption.  Default: `64`
- `password_pbkdf2_iterations`: (ADVANCED) The number of iterations to use when generating an encrypted password using pbkdf2.  Default: `10000`
- `token_expiration_minutes`: (ADVANCED) The lifespan of authentication tokens.  Once a token has been issued, it will remain valid (meaning whoever presents that token will successfully authenticate as that user) for some number (token_expiration_minutes) of minutes.  Default: `30`
- `jwt_secret`: (ADVANCED) The secret used to encrypt and decrypt JWT tokens.  By default this is a randomly generated string (which is secure but doesn't allow for horizontal scaling or token validity across server restarts).


# Utilities

## REM Server

There is a simple Express server at `REM.Server`, a sample of its usage can be found in the `examples` directory.  The REMServer constructor takes a normal REM options object, but with the following additions:

- *port* may be specified to indicate where the server should do its thing.  Defaults to process.env['PORT'] or 3000
- *baseURL* the base URL at which the express server should do its thing.  Defaults to '/'

The following API methods are available on a REMServer object:

- *start*: Start the server (returns itself for chaining purposes)
- *stop*: Stop the server

### REM.serve

To make things even more dead-simple, you can create and start a REMServer in one go by calling `REM.serve(options)`.  `options` is a REMServer options object with one addition:

- *dataDirectory*: If specified, `options.engine` is no longer required and the server will automatically create local NeDB databases for you in the directory provided.  See the examples for use of `REM.serve`.

# Other fun stuff

## Contributing

Contributions are welcome.  This is still an early prototype, so there's a lot to do.

### Tests

Any new features should be testable, and the existing tests should pass.

Run `npm test` to be sure everything is working.

## License

[MIT](http://opensource.org/licenses/MIT)
