var REM = require('../');

var options = {
  dataDirectory: "./data/simple_example",
  version: "1.0",
  baseURL: "/api",
  resources: {
      'employees': {},
      'departments': {
          children: ['employees']
      }
  }
};

REM.serve( options );
