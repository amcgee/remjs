var REMServer = require('./server.js');
var Datastore = require('nedb');
var path = require('path');
var _ = require('lodash');

var serve = function( options ) {
	if ( !options.engine && options.dataDirectory )
	{
		//Create NeDB databases for each resource
		options.engine = {};
		_.forEach( options.resources, function( resource, name ) {
			if ( !resource.engine ) // Don't overwrite an engine explicitly set on a sub-resource
			{
				options.engine[name] = new Datastore({ filename: path.join( options.dataDirectory, name + ".db" ), autoload: true })
			}
		})
	}
	
	var server = new REMServer( options );
	return server.start();
}

module.exports = serve;