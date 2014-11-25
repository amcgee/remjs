var jwt = require( 'jwt-simple' );
var crypto = require( 'crypto' );
var _ = require('lodash');

var DEFAULT_EXPIRATION_MINUTES = 30;
var JWT_SECRET_LENGTH = 64;

var timestampToDate = function( timestamp ) {
	return new Date( timestamp * 1000 )
}
var dateToTimestamp = function( date ) {
	return date.getTime() / 1000;
}

var JWT = function(options) {
	this.options = options || {};
	if ( !_.isNumber( this.options.token_expiration_minutes ) )
		this.options.token_expiration_minutes = DEFAULT_EXPIRATION_MINUTES;
	this.secret = this.options.jwt_secret || crypto.randomBytes(JWT_SECRET_LENGTH).toString('base64');
}
JWT.prototype.getExpiration = function( timestamp ) {
	return timestamp + (this.options.token_expiration_minutes*60);
}
JWT.prototype.parse = function( req, next ) {
	if ( !req.get('Authorization') )
		return next("No Authorization header found.");
	var authHeader = req.get('Authorization').split( ' ' );
	if ( authHeader.length != 2 || authHeader[0] !== "Bearer" )
		return next("Invalid Authorization header.");
	var token = authHeader[1]
	
	var payload = null;
	try
	{
		payload = jwt.decode( token, this.secret );
	}
	catch (e)
	{
		console.log( "JWT error occurred: ", e );
	}
	if ( !payload || !payload.iat && !payload.exp )
		return next( "Invalid JWT token." )
	
	var now = dateToTimestamp( new Date() );
	if ( payload.exp 
		&& payload.exp <= now )
		return next( "Expired JWT token." )
	if ( payload.iat
	 && this.getExpiration( payload.iat ) <= now )
		return next( "Expired JWT token (exipration length changed server-side)" );
		
	return next( null, payload.id );
}
JWT.prototype.create = function( identity ) {
	// TODO: AUTH

	var now = dateToTimestamp( new Date() );
	var payload = {
		id: identity,
		iat: now,
		exp: this.getExpiration( now )
	}
	var token = jwt.encode( payload, this.secret );
	console.log( "New JWT auth token created: ", payload, token );
	return token;
}
module.exports = JWT;