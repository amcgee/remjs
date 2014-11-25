var express = require('express');
var REM = require('../index');
var Datastore = require('nedb');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var Scaffolding = function( resources, options ) {
	console.log( "Constructing test scaffolding...")
	this.port = 3000 + Math.floor(Math.random()*1000);
	
	this.db = {};
	this.dbFiles = [];
	_.forEach( _.keys(resources), function(name) {
		var file = './data/test-' + this.port + '/' + name + '.db';
		this.db[name] = new Datastore({ filename: file, autoload: true });
		this.dbFiles.push(file);
	}.bind(this))

	console.log( "Database files created.")

	options = _.extend( {
		version: "TEST",
		engine: this.db,
		resources: resources,
		baseURL: "/api",
		port: this.port
	}, options );
	this.server = new REM.Server(options);
	console.log( "Test scaffolding erected.")

	console.log( "Starting test server...")
	this.server.start();
}
Scaffolding.prototype.destroy = function() {
	this.server.stop();
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

module.exports.create = function(resources,options) {
	return new Scaffolding(resources,options);
}