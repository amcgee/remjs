var REM = require('../');

var options = {
    dataDirectory: "./data/authentication_example",
    version: "1.0",
    authentication: {
    	anonymous_signup: true,
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