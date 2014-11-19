# REMJS

Rapid Eye Movement (REM) : A dead-simple REST API framework.  Now go back to sleep, you were having a good dream.

Currently, only NeDB and a subset of MongoDB are supported backend engines.

Current version: `0.1.3 (alpha)`

#Installation

```shell
npm install remjs
```

#Usage

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

Try it!
```shell
git clone https://github.com/amcgee/remjs.git
cd remjs
npm install
node examples/simple_example.js
```

Now, you can interact with your new API however you please.  If you're using cURL and [jq](http://stedolan.github.io/jq/) for JSON parsing:

```shell
$ curl http://localhost:3000/api/_help | jq '.'
[
  "employees",
  "departments"
]

$ curl http://localhost:3000/api/departments | jq '.'
[]

$ curl -H "Content-Type: application/json" -d '{"name":"TPSReportDepartment","purpose":"NONE"}' http://localhost:3000/api/departments | jq '.'
{
  "name": "TPSReportDepartment",
  "purpose": "NONE",
  "_id": "9QWrPtnkK63Hb0WF"
}

$ curl http://localhost:3000/api/departments | jq '.'
[
  {
    "name": "TPSReportDepartment",
    "purpose": "NONE",
    "_id": "9QWrPtnkK63Hb0WF"
  }
]

$ DPTID=`curl http://localhost:3000/api/departments | jq '.[0]._id' | sed -e 's/^"//'  -e 's/"$//'`

$ curl http://localhost:3000/api/departments/$DPTID | jq '.'
{
  "name": "TPSReportDepartment",
  "purpose": "NONE",
  "_id": "9QWrPtnkK63Hb0WF"
}

$ curl http://localhost:3000/api/departments/$DPTID/employees | jq '.'
[]

$ curl -H "Content-Type: application/json" -d '{"name":"Joe Schmoe","salary":250}' http://localhost:3000/api/departments/$DPTID/employees | jq '.'
{
  "departments_id": "9QWrPtnkK63Hb0WF",
  "name": "Joe Schmoe",
  "salary": 250,
  "_id": "tGmX6t8G6rha8ma4"
}

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

#Contributions

Contributions are welcome.  This is still an early prototype, so there's a lot to do.

#License

[MIT](http://opensource.org/licenses/MIT)
