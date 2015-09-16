var REMServer = require('./server');
var NeDB = require('../engines/nedb');

var serve = function( options ) {
    if ( !options.engine && options.dataDirectory ) {
        //Create NeDB databases for each resource
        options.engine = new NeDB({
            rootDirectory: options.dataDirectory
        });
    }

    var server = new REMServer( options );
    return server.start();
};

module.exports = serve;
