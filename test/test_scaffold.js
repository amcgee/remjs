var express = require('express');
var REM = require('../index');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var Scaffolding = function( resources, options ) {
	console.log( "Constructing test scaffolding...");
	this.port = 3000 + Math.floor(Math.random()*1000);
	options = options || {};
	
	if ( !options.engine )
	{
		this.dbFiles = {};
		this.dataDirectory = './data/test-' + this.port;
		_.forEach( _.keys(resources), function(name) {
			var file = path.join( this.dataDirectory, name + '.db' );
			this.dbFiles[name] = file;
		}.bind(this));

		options.engine = REM.engine.nedb({
			dbFiles: this.dbFiles
		});
	}

	console.log( "Database files created.");

	this.options = _.extend( {
		version: "TEST",
		resources: resources,
		baseURL: "/api",
		port: this.port
	}, options );
};
Scaffolding.prototype.erect = function() {
	console.log( "Test scaffolding erected.");
	this.server = new REM.Server(this.options);

	console.log( "Starting test server...");
	this.server.start();

	return this;
};
Scaffolding.prototype.destroy = function() {
	this.server.stop();

	if ( this.dataDirectory )
	{
		console.log( "Destroying database files." );
		_.forEach( this.dbFiles, function( file ) {
			fs.unlinkSync( file );
		});
		fs.rmdirSync( this.dataDirectory );
	}
	return this;
};
Scaffolding.prototype.baseURL = function() {
	return "http://localhost:" + this.port + "/api";
};

module.exports.create = function(resources,options) {
	return new Scaffolding(resources,options);
};