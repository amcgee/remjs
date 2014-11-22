var REM = require('../');

var options = {
    dataDirectory: "./data/authentication_example",
    version: "1.0",
    authentication: {
    	annonymous_signup: true,
    	login_authority: {
    		resource: 'users'
    	}
    },
    resources: {
        'employees': {},
        'departments': {
            children: ['employees']
        },
        'users': {}
    }
}

REM.serve( options );