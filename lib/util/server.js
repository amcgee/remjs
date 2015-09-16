var express = require('express');
var REM = require('../core.js');

var REMServer = function( options ) {
    this.app = express();
    this.options = options;
    this.options.baseURL = options.baseURL || "/";
    this.options.port = options.port || process.env.PORT || 3000;

    this.rem = new REM(options);

    this.socket = null;
};

REMServer.prototype.start = function(callback) {
    return this.rem.connect()
    .bind(this)
    .then(function(rem) {
        this.app.use( this.options.baseURL, rem.router );
        this.socket = this.app.listen( this.options.port );
    })
    .bind(this)
    .then( function() {
        return(this);
    })
    .bind().nodeify(callback);
};
REMServer.prototype.stop = function() {
    if ( this.socket ) {
        this.socket.close();
    }
    return this;
};

module.exports = REMServer;
