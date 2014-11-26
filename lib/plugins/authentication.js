var _ = require( 'lodash' );
var express = require( 'express' );
var JWT = require('./auth_helpers/jwt')
var LoginHelper = require('./auth_helpers/login')

var Authenticator = function(resources, options) {
	this.options = _.clone(options.authentication) || {};

	this.jwt = new JWT(this.options);
	this.loginHelper = new LoginHelper(this.options, resources)
	
	this.options.login_path = this.options.login_path || "/_login";
	this.options.signup_path = this.options.signup_path || "/_signup";
	this.options.me_path = this.options.me_path || "/me"; // this is a pho-resource which is an alias to the logged-in identity
	this.options.annonymous_signup = this.options.annonymous_signup || false;
}

Authenticator.prototype.login = function(req, res, next) {
	if ( !req.body["login"]
	  || !req.body["password"] )
  {
  	return res.status( 400 ).send("Login and password values are required.");
  }

  this.loginHelper.check( req.body["login"], req.body["password"], function( err, identity ) {
  	if ( err ) {
  		return res.status( 400 ).send( "Invalid username or password." );
  	}
  	return res.status( 200 ).send( this.jwt.create( identity ) );
  }.bind(this) );
  
}
Authenticator.prototype.signup = function(req, res, next) {
	if ( !req.body["login"]
	  || !req.body["password"] )
  {
  	return res.status( 400 ).send("Login and password values are required.");
  }
  
  this.loginHelper.create( req.body['login'], req.body['password'], {}, function( err, identity ) {
  	if ( err ) {
  		if ( err == "That login already exists.") //TODO: Make this better
  			return res.status(400).send("Login already exists.");
  		return res.status(500).send("Failed to create login.");
  	}
  	return res.status(201).send( identity );
  })
}
Authenticator.prototype.meRouter = function() {
	var meRouter = express.Router();

	meRouter.use( function(req, res, next) {
		if ( !req.rem.identity )
			return res.status(401).send("Please log in.");
		next();
	} );

	meRouter.get( "/", function(req, res) {
		return res.status( 200 ).send( req.rem.identity );
	})

	meRouter.post( "/_password", function(req, res) {
		if ( !req.body || !req.body.old_password || !req.body.new_password )
			return res.status( 400 ).send( "Invalid password reset request." );
		this.loginHelper.update( req.rem.identity[this.loginHelper.authority.login_property], req.body.old_password, req.body.new_password, {}, function(err) {
			if (err) {
				return res.status(500).send("Failed to update password.");
			}
			return res.status( 200 ).send( "Password reset complete" );
		})
	}.bind(this) )
	meRouter.delete( "/_password", function(req,res) {
		if ( !req.body || !req.body.old_password )
			return res.status( 400 ).send( "Invalid password reset request." );
		this.loginHelper.reset( req.rem.identity[this.loginHelper.authority.login_property], req.body.old_password, function(err,pwd) {
			if (err) {
				return res.status(500).send("Failed to update password.");
			}
			return res.status( 200 ).send( pwd );
		})
	}.bind(this) )
	return meRouter;
}
Authenticator.prototype.authenticate = function(req, res, next) {
	var errors = [];
	this.jwt.parse( req, function( err, candidate ) {
		if ( err )
		{
			console.log( "Authentication failed : " + err );
			res.status( 401 ).set('WWW-Authenticate','Bearer').send( "Not authorized." );
		}
		else if ( candidate )
		{
			this.loginHelper.lookup( candidate, function(err, identity) {
				if ( err ) {
					return res.status( 401 ).send( "Authentication failed." );
				}
				req.rem.identity = identity
				next();
			} );
		}
		else
		{
			//annonymous
			next();
		}
	}.bind(this));
}
Authenticator.prototype.router = function( req, res, next ) {
	var router = express.Router();

	router.post( this.options.login_path, this.login.bind( this ) );
	if ( this.options.annonymous_signup )
		router.post( this.options.signup_path, this.signup.bind( this ) );
	
	router.use( this.authenticate.bind( this ) );

	//This route requires that we've already authenticated
	router.use( this.options.me_path, this.meRouter() );

	return router;
}

var createAuthenticator = function( resources, options ) {
	if ( !options.authentication )
		return function(req,res,next){ return next(); };

	var auth = new Authenticator( resources, options );
	return auth.router();
}

module.exports = createAuthenticator;