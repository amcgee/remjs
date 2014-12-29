var express = require('express');
var REM = require('../index');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var Scaffolding = function( name, resources, options ) {
	console.log( "Constructing test scaffolding for '" + name + "'...");
	this.port = 3000 + Math.floor(Math.random()*1000);
	options = options || {};
	this.dbFiles = {};

	if ( !options.engine )
	{
		if ( process.env.TESTDB == "mongo" )
		{
			var dbname = "test-" + this.port;
			options.engine = REM.engine.mongodb({
				dbname: dbname,
				host: 'localhost',
				port: 27017
			});
			console.log( "Database created : " + dbname );
		}
		else
		{
			this.dataDirectory = './data/test-' + this.port;
			_.forEach( _.keys(resources), function(name) {
				var file = path.join( this.dataDirectory, name + '.db' );
				this.dbFiles[name] = file;
			}.bind(this));

			options.engine = REM.engine.nedb({
				dbFiles: this.dbFiles
			});
			console.log( "Database files created : " + this.dataDirectory );
		}
	}

	this.options = _.extend( {
		version: "TEST",
		resources: resources,
		baseURL: "/api",
		port: this.port
	}, options );
};
Scaffolding.prototype.erect = function(done) {
	console.log( "Test scaffolding erected.");
	this.server = new REM.Server(this.options);

	console.log( "Starting test server...");
	this.server.start()
	.then( function() {
		done();
	});
};
Scaffolding.prototype.destroy = function() {
	this.server.stop();

	if ( process.env.TESTDB == "mongo" ) {
		this.options.engine.db.dropDatabase();
	}
	else if ( this.dataDirectory )
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

module.exports.create = function(name,resources,options) {
	return new Scaffolding(name,resources,options);
};