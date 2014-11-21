var REM = require('../');

var options = {
    dataDirectory: "./data/simple_example",
    version: "1.0",
    authentication: {},
    resources: {
        'employees': {},
        'departments': {
            children: ['employees']
        }
    }
}

REM.serve( options );