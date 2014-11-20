# REM

Rapid Eye Movement (REM) : A dead-simple REST API framework for NodeJS.  Now go back to sleep, you were having a good dream.

Currently, only NeDB and a subset of MongoDB are supported backend engines, but more will be introduced soon.

##Installation

Install your favorite database, currently supported: 

- [NeDB](https://github.com/louischatriot/nedb) for local data storage
- [MongoDB](http://www.mongodb.org/) for more robust, production-grade use cases
- *More coming soon, including various flavors of SQL by way of [knex](http://knexjs.org/)!*

Now, install [remjs](http://npmjs.org/package/remjs) via [npm](http://npmjs.org)
```shell
npm install remjs
```

##Basic Usage

A simple example using the [REM.serve](#REMJS-Server-REM.serve) utility function and [NeDB](https://github.com/louischatriot/nedb) for local data storage
```javascript
var REM = require('../');

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

The important part is the options hash, which supports the following:

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

##Server

There is a simple Express server at `REM.Server`, a sample of its usage can be found in the `examples` directory.  The REMServer constructor takes a normal REM options object, but with the following additions:

- *port* may be specified to indicate where the server should do its thing.  Defaults to process.env['PORT'] or 3000
- *baseURL* the base URL at which the express server should do its thing.  Defaults to '/'

The following API methods are available on a REMServer object:

- *start*: Start the server (returns itself for chaining purposes)
- *stop*: Stop the server

### REM.serve

To make things even more dead-simple, you can create and start a REMServer in one go by calling `REM.serve(options)`.  `options` is a REMServer options object with one addition:

- *dataDirectory*: If specified, `options.engine` is no longer required and the server will automatically create local NeDB databases for you in the directory provided.  See the examples for use of `REM.serve`.

#Other fun stuff

##Contributing

Contributions are welcome.  This is still an early prototype, so there's a lot to do.

### Tests

Any new features should be testable, and the existing tests should pass.

Run `npm test` to be sure everything is working.

##License

[MIT](http://opensource.org/licenses/MIT)
