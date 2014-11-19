var express = require('express');
var _ = require('lodash');
var REMResource = require('./resource');

var REM = function(options) {
	if ( !options.version )
		throw new Error("REM version is required.")
	if ( !options.engine )
		throw new Error("REM engine is required.")
	var router = express.Router();

	router.get( '/_version', function( req, res ) {
		res.status(200).send(options.version);
	})
	router.get( '/_help', function( req, res ) {
		res.status(200).send(_.keys(options.resources));
	})

	_.forEach( _.extend({},options.resources), function( resource_options, resource ) {
		resource_options = _.extend( _.extend({ engine: options.engine }, resource_options), { name: resource } );
		router.use( '/' + resource, new REMResource( resource_options ) )
	} );

	return router;
}

module.exports = REM;