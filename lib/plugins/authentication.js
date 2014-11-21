var _ = require( 'lodash' );

var JWT = require('./auth_decoders/jwt.js')

var Authenticator = function(options) {
	this.jwt = new JWT(options.authentication);
	options.authentication = options.authentication || {};
	if ( options.authentication.lookupFunction )
		this.lookupFunction = options.authentication.lookupFunction;
	else
		this.lookupFunction = function( value, req, res, next ) {
			console.log( "IDENTITY ", value );
			req.authentication = {
				identity: value
			}
			next();
		}
}

Authenticator.prototype.authenticate = function(req, res, next) {
	var errors = [];
	if ( req.path == '/login' )
	{
		return res.status( 200 ).send( this.jwt.create() );
	}
	this.jwt.authenticate( req, function( err, result ) {
		if ( err || !result )
		{
			console.log( err );
			res.status( 401 ).send( "Not authorized." );
		}
		else
			this.lookupFunction( result, req, res, next );
	}.bind(this));
}

var createAuthenticator = function( options ) {
	if ( !options.authentication )
		return null;

	var auth = new Authenticator( options );

	return function( req, res, next ) {
		auth.authenticate( req, res, next );
	}
}

module.exports = createAuthenticator;