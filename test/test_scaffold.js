var express = require('express');
var REM = require('../index');
var Datastore = require('nedb');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var Scaffolding = function( resources ) {
	console.log( "Constructing test scaffolding...")

	this.app = express();
	this.port = 3000 + Math.floor(Math.random()*1000);
	
	this.db = {};
	this.dbFiles = [];
	_.forEach( _.keys(resources), function(name) {
		var file = './test_data/' + this.port + '/' + name + '.db';
		this.db[name] = new Datastore({ filename: file, autoload: true });
		this.dbFiles.push(file);
	}.bind(this))

	console.log( "Database files created.")

	var options = {
		version: "TEST",
		engine: this.db,
		resources: resources
	}
	this.app.use( "/api", REM(options) );
	this.server = null;
	console.log( "Test scaffolding erected.")
}
Scaffolding.prototype.start = function() {
	console.log( "Starting test server...")
	this.server = this.app.listen( this.port );
	return this;
}
Scaffolding.prototype.stop = function() {
	if ( this.server )
	{
		this.server.close();
		console.log( "Stopped test server." )
	}
	return this;
}
Scaffolding.prototype.destroy = function() {
	this.stop();
	console.log( "Destroying database files." )
	_.forEach( this.dbFiles, function( file ) {
		fs.unlink( file, function( err ) {
			//PASS
		} );
	})
	return this;
}
Scaffolding.prototype.baseURL = function() {
	return "http://localhost:" + this.port + "/api";
}

module.exports.create = function(options) {
	return new Scaffolding(options);
}