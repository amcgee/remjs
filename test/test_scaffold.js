var express = require('express');
var REM = require('../index');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var test_databases = require('./test_databases');

var Scaffolding = function( name, resources, options, db ) {
	console.log( "Constructing test scaffolding for '" + name + "'...");
	this.port = 3000 + Math.floor(Math.random()*1000);
	options = _.clone( options || {} );
	this.dbFiles = {};

	if ( !options.engine )
	{
		var dbname = "test-" + this.port;
		switch ( db ) {
			case 'mongodb':
				options.engine = REM.engine.mongodb({
					dbname: dbname,
					host: 'localhost',
					port: 27017
				});
				break;
			case 'nedb':
			case null:
			case undefined:
				this.dataDirectory = './data/test-' + this.port;
				_.forEach( _.keys(resources), function(name) {
					var file = path.join( this.dataDirectory, name + '.db' );
					this.dbFiles[name] = file;
				}.bind(this));

				options.engine = REM.engine.nedb({
					dbFiles: this.dbFiles
				});
				break;
			default:
				throw new Error("Unknown database '" + db + "'");
		}
		console.log( "Database created : " + db + " - " + dbname );
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

module.exports.deploy = function(name, resources, options, dbs, body) {
	if ( arguments.length == 4 )
	{
		body = dbs;
		dbs = _.keys(test_databases);
	}

	var fn = function(test_name, db) {
		var scaffolding = new Scaffolding(test_name, resources, options, db);
		before(function(done) {
	    scaffolding.erect(done);
  		console.log( "Base URL: %s", scaffolding.baseURL() );
	  });
	  after(function() {
	    scaffolding.destroy();
	  });
	  body( scaffolding );
	};
	_.forEach( dbs, function(db) {
		var test_name = db + '::' + name;
		describe( test_name, fn.bind(null,test_name, db) );
	} );
};