var express = require('express');
var REM = require('../index');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var supertest = require('supertest');
var chai = require('chai');
var should = chai.should();

var test_databases = require('./test_databases');

var Scaffolding = function( name, resources, options, db ) {
	console.log( "Constructing test scaffolding for '" + name + "'...");
	this.port = 3000 + Math.floor(Math.random()*1000);
	options = _.clone( options || {} );
	this.dbFiles = {};

	if ( !options.engine )
	{
		this.dbname = "test-" + this.port;
		this.dbtype = db;
		switch ( db ) {
			case 'mongodb':
				options.engine = REM.engine.mongodb({
					url: 'mongodb://localhost:27017/'+this.dbname
				});
				break;
			// case 'sql':
			// 	options.engine = REM.engine.sql({
			// 	  client: 'sqlite3',
			// 	  connection: {
			// 	    filename: "./data/" + this.dbname + ".sqlite.db"
			// 	  }
			// 	});
			// 	break;
			case 'nedb':
			case null:
			case undefined:
				this.dbtype = 'nedb';
				this.dataDirectory = './data/' + this.dbname;
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
		console.log( "Database created : " + db + " - " + this.dbname );
	}

	this.options = _.extend( {
		version: "TEST",
		resources: resources,
		baseURL: "/api",
		port: this.port
	}, options );

	this.server = new REM.Server(this.options);
};
Scaffolding.prototype.erect = function(done) {
	console.log( "Test scaffolding erected.");

	console.log( "Starting test server...");
	this.server.start()
	.then( function() {
		done();
	});
};
Scaffolding.prototype.destroy = function() {
	this.server.stop();

	switch ( this.dbtype ) {
		case 'mongodb':
			this.options.engine.db.dropDatabase();	
			break;
		case 'nedb':
			_.forEach( this.dbFiles, function( file ) {
				fs.unlinkSync( file );
			});
			fs.rmdirSync( this.dataDirectory );
	}
	console.log( "Test database destroyed." );
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
		var agent = supertest(scaffolding.baseURL());
		before(function(done) {
	    scaffolding.erect(done);
  		console.log( "Base URL: %s", scaffolding.baseURL() );

	  });
	  after(function() {
	    scaffolding.destroy();
	  });
	  body( scaffolding, agent );
	};
	_.forEach( dbs, function(db) {
		var test_name = db + '::' + name;
		describe( test_name, fn.bind(null,test_name, db) );
	} );
};

module.exports.should = should;