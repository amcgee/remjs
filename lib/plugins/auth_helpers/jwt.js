var jwt = require( 'jwt-simple' );
var crypto = require( 'crypto' );
var _ = require('lodash');
var BPromise = require('bluebird');

var DEFAULT_EXPIRATION_MINUTES = 30;
var JWT_SECRET_LENGTH = 64;

var dateToTimestamp = function( date ) {
	return date.getTime() / 1000;
};

var JWT = function(options) {
	this.options = options || {};
	if ( !_.isNumber( this.options.token_expiration_minutes ) )
		this.options.token_expiration_minutes = DEFAULT_EXPIRATION_MINUTES;
	this.secret = this.options.jwt_secret || crypto.randomBytes(JWT_SECRET_LENGTH).toString('base64');
};
JWT.prototype.getExpiration = function( timestamp ) {
	return timestamp + (this.options.token_expiration_minutes*60);
};
JWT.prototype.parse = function( token, callback ) {
	return BPromise.try( function() {
		return jwt.decode( token, this.secret );
	}.bind(this) )
	.bind(this)
	.then( function(payload) {
		if ( !payload.iat && !payload.exp )
		{
			console.log( token );
			if ( payload )
				console.log( payload );
			throw new Error("No Issued or Expiration time found in JWT token.");
		}
		return payload;
	})
	.then( function(payload) {
		var now = dateToTimestamp( new Date() );
		if ( payload.exp && payload.exp <= now )
			throw new Error( "Expired JWT token." );
		if ( payload.iat && this.getExpiration( payload.iat ) <= now )
			throw new Error( "Expired JWT token (exipration length changed server-side)" );
			
		return payload.id;
	})
	.catch( function(e) {
		console.log( "JWT error occurred: ", e );
		throw new Error("Invalid JWT token.");
	})
	.bind().nodeify(callback);
};
JWT.prototype.create = function( identity ) {
	var now = dateToTimestamp( new Date() );
	var payload = {
		id: identity,
		iat: now,
		exp: this.getExpiration( now )
	};
	var token = jwt.encode( payload, this.secret );
	console.log( "New JWT auth token created: ", payload, token );
	return token;
};
module.exports = JWT;