var jwt = require( 'jwt-simple' )
var _ = require('lodash');

var DEFAULT_EXPIRATION_MINUTES = 30;
var jwtSecret = 'abcd';

var timestampToDate = function( timestamp ) {
	return new Date( timestamp * 1000 )
}
var dateToTimestamp = function( date ) {
	return date.getTime() / 1000;
}

var JWT = function(options) {
	this.options = options || {};
	if ( !_.isNumber( this.options.expirationMinutes ) )
		this.options.expirationMinutes = DEFAULT_EXPIRATION_MINUTES;
}
JWT.prototype.getExpiration = function( timestamp ) {
	return timestamp + (this.options.expirationMinutes*60);
}
JWT.prototype.authenticate = function( req, next ) {
	if ( !req.get('Authorization') )
		return next();
	var authHeader = req.get('Authorization').split( ' ' );
	if ( authHeader.length != 2 || authHeader[0] !== "Bearer" )
		return next();
	var token = authHeader[1]
	
	var payload = null;
	try
	{
		payload = jwt.decode( token, jwtSecret );
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
JWT.prototype.create = function() {
	// TODO: AUTH

	var now = dateToTimestamp( new Date() );
	var payload = {
		id: { foo: 'bar' },
		iat: now,
		exp: this.getExpiration( now )
	}
	var token = jwt.encode( payload, jwtSecret );
	console.log( "New JWT auth token created: ", payload, token );
	return token;
}
module.exports = JWT;