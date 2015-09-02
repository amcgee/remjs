var express = require('express');
var _ = require('lodash');
var bodyParser = require('body-parser');
var REMResource = require('./resource');
var BPromise = require('bluebird');

var authentication = require('./plugins/authentication');

var REM = function(options) {
	if ( !options.version )
		throw new Error("REM version is required.");
	if ( !options.engine )
		throw new Error("REM engine is required.");

	this.options = _.clone(options);

	this.connected = false;
};

REM.prototype.connect = function(callback) {
	var connectFunction = BPromise.delay.bind(null, 1);
	if ( this.options.engine.connect )
		connectFunction = this.options.engine.connect.bind(this.options.engine);

	return connectFunction()
	.catch(function(e) {
		throw new Error( "Failed to connect to the database engine.  Error: " + e );
	})
	.bind(this)
	.then(function() {
		this.resources = _.mapValues( _.extend({}, this.options.resources), function( resource_options, resource_name ) {
			resource_options = _.extend({
				engine: this.options.engine,
				permissions: (this.options.authentication? ( this.options.permissions || {} ) : null )
			}, resource_options );
			return new REMResource( resource_name, resource_options );
		}.bind(this) );

		this.createRouter();
		this.connected = true;
	})
	.return(this)
	.nodeify(callback);
};

REM.prototype.createRouter = function() {
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
		} else {
			next();
		}
	} );

	if ( this.options.authentication )
	{
		this.authentication = authentication(this.resources, this.options);
		router.use( this.authentication.router() );
	}

	router.get( '/_version', function( req, res ) {
		res.status(200).send(this.options.version);
	}.bind(this));
	router.get( '/_help', function( req, res ) {
		res.status(200).send(_.keys(this.resources));
	}.bind(this));

	_.forEach( this.resources, function( resource, resource_name ) {
		router.use( "/" + resource_name, resource.router );
	} );

	this.router = router;
};

module.exports = REM;
