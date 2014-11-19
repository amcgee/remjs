# REMJS Core

Rapid Eye Movement (REM) : A dead-simple REST API framework.  Now go back to sleep, you were having a good dream.

Currently, only NeDB and a subset of MongoDB are supported backend engines.

Current version: `0.1.3 (alpha)`

##Installation

```shell
npm install remjs
```

##Usage

A simple example
```javascript
var express = require('express');
var REM = require('remjs');
var Datastore = require('nedb');

var db = {
    employees: new Datastore({ filename: './employees.db', autoload: true }),
    departments: new Datastore({ filename: './departments.db', autoload: true })
}
var app = express();
var options = {
    version: "1.0",
    engine: db,
    resources: {
        'employees': {},
        'departments': {
            children: ['employees']
        }
    }
}
app.use( "/api", REM(options) );

app.listen(3000);
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

Now, you can interact with your new API however you please.  The following examples assume [cURL](http://curl.haxx.se/), [jq](http://stedolan.github.io/jq/) for JSON parsing, [NeDB](https://github.com/louischatriot/nedb) for local data storage, and basic linux terminal familiarity.

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
$ curl http://localhost:3000/api/departments/$DPTID/employees | jq '.'
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

#Other fun stuff

##Contributions

Contributions are welcome.  This is still an early prototype, so there's a lot to do.

##License

[MIT](http://opensource.org/licenses/MIT)
