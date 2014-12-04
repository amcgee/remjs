var express = require('express');
var REM = require('../index');
var Datastore = require('nedb');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var Scaffolding = function( resources, options ) {
	console.log( "Constructing test scaffolding...");
	this.port = 3000 + Math.floor(Math.random()*1000);
	
	if ( !options.engine )
	{
		options.engine = {};
		this.dbFiles = [];
		this.dataDirectory = './data/test-' + this.port;
		_.forEach( _.keys(resources), function(name) {
			var file = path.join( this.dataDirectory, name + '.db' );
			options.engine[name] = new Datastore({ filename: file, autoload: true });
			this.dbFiles.push(file);
		}.bind(this));
	}

	console.log( "Database files created.");

	this.options = _.extend( {
		version: "TEST",
		engine: this.db,
		resources: resources,
		baseURL: "/api",
		port: this.port
	}, options );
};
Scaffolding.prototype.erect = function() {
	this.engine; = new MongoEngine( )
	this.server = new REM.Server(options);
	console.log( "Test scaffolding erected.");


	console.log( "Starting test server...");
	this.server.start();
}
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