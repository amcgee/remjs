var express = require('express');
var REM = require('../core.js');

var REMServer = function( options ) {
	this.app = express();
	this.options = options;
	this.options.baseURL = options.baseURL || "/";
	this.options.port = options.port || process.env.PORT || 3000;
	
	this.app.use( options.baseURL, REM(options) );

	this.socket = null;
};

REMServer.prototype.start = function() {
	this.socket = this.app.listen( this.options.port );
	return this;
};
REMServer.prototype.stop = function() {
	if ( this.socket )
	{
		this.socket.close();
	}
	return this;
};

module.exports = REMServer;