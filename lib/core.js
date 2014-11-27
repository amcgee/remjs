var express = require('express');
var _ = require('lodash');
var bodyParser = require('body-parser');
var REMResource = require('./resource');

var authentication = require('./plugins/authentication');

var REM = function(options) {
	if ( !options.version )
		throw new Error("REM version is required.");
	if ( !options.engine )
		throw new Error("REM engine is required.");

	var resources = {};
	_.forEach( _.extend({},options.resources), function( resource_options, resource_name ) {
		resource_options = _.extend({
			engine: options.engine,
			permissions: (options.authentication? ( options.permissions || {} ) : null )
		}, resource_options );
		resources[resource_name] = new REMResource( resource_name, resource_options );
	} );

	var router = express.Router();

	router.use( function(req, res, next) {
		req.rem = {};
		res.set( 'X-Powered-By', 'Express/REM.js' );
		next();
	} );

	router.use( bodyParser.json() );
	router.use( function( err, req, res, next ) { 
		if ( err ) { // TODO: Make sure it's actually a JSON error?
			console.log( "Invalid JSON." );
			res.status(400).send("Invalid JSON.");
		}
	} );

	router.use( authentication(resources, options) );

	router.get( '/_version', function( req, res ) {
		res.status(200).send(options.version);
	});
	router.get( '/_help', function( req, res ) {
		res.status(200).send(_.keys(resources));
	});

	_.forEach( resources, function( resource, resource_name ) {
		router.use( "/" + resource_name, resource.router );
	} );

	return router;
};

module.exports = REM;