var express = require('express');
var REM = require('../');
var Datastore = require('nedb');

var db = {
    employees: new Datastore({ filename: './data/simple_example/employees.db', autoload: true }),
    departments: new Datastore({ filename: './data/simple_example/departments.db', autoload: true })
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