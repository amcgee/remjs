var _ = require( 'lodash' );
var express = require( 'express' );
var JWT = require('./auth_helpers/jwt');
var LoginHelper = require('./auth_helpers/login');

var Authenticator = function(resources, options) {
	this.options = _.clone(options.authentication) || {};

	this.jwt = new JWT(this.options);
	this.loginHelper = new LoginHelper(this.options, resources);
	
	this.options.login_path = this.options.login_path || "/_login";
	this.options.signup_path = this.options.signup_path || "/_signup";
	this.options.me_path = this.options.me_path || "/me"; // this is a pho-resource which is an alias to the logged-in identity
	this.options.anonymous_signup = this.options.anonymous_signup || false;
};

Authenticator.prototype.login = function(req, res) {
	if ( !req.body.login || !req.body.password )
	{
		return res.status( 400 ).send("Login and password values are required.");
	}

	this.loginHelper.check( req.body.login, req.body.password )
	.bind(this)
	.then( function(identity) {
		res.status( 200 ).send( this.jwt.create( identity ) );	
	})
	.catch( function(e) {
		console.log(e);
		res.status( 400 ).send( "Invalid username or password." );
	});
};

Authenticator.prototype.signup = function(req, res) {
	if ( !req.body.login || !req.body.password )
  {
  	return res.status( 400 ).send("Login and password values are required.");
  }
  
  this.loginHelper.create( req.body.login, req.body.password, {} )
  .then( function(identity) {
	  res.status(201).send( identity );
	})
	.catch( LoginHelper.LoginAlreadyExistsError, function() {
		res.status(400).send("Login already exists.");
	})
	.catch( function() {
		res.status(500).send("Failed to create login.");
	});
};
Authenticator.prototype.meRouter = function() {
	var meRouter = express.Router();

	meRouter.use( function(req, res, next) {
		if ( !req.rem.identity )
			return res.status(401).send("Please log in.");
		next();
	} );

	meRouter.get( "/", function(req, res) {
		return res.status( 200 ).send( req.rem.identity );
	});

	meRouter.post( "/_password", function(req, res) {
		if ( !req.body || !req.body.old_password || !req.body.new_password )
			return res.status( 400 ).send( "Invalid password reset request." );
		this.loginHelper.update( req.rem.identity[this.loginHelper.authority.login_property], req.body.old_password, req.body.new_password, {})
		.bind(this)
		.then(function() {
			res.status( 200 ).send( "Password reset complete" );
		})
		.catch( LoginHelper.BadPasswordError, function() {
			res.status(400).send("Invalid password.");
		})
		.catch(function() {
			res.status(500).send("Failed to update password.");
		});
	}.bind(this) );
	meRouter.delete( "/_password", function(req,res) {
		if ( !req.body || !req.body.old_password )
			return res.status( 400 ).send( "Invalid password reset request." );
		this.loginHelper.reset( req.rem.identity[this.loginHelper.authority.login_property], req.body.old_password )
		.then(function(pwd) {
			res.status( 200 ).send( pwd );
		})
		.catch( LoginHelper.BadPasswordError, function() {
			res.status(400).send("Invalid password.");
		})
		.catch(function() {
			res.status(500).send("Failed to update password.");
		});
	}.bind(this) );
	return meRouter;
};
Authenticator.prototype.authenticate = function(req, res, next) {
	if ( !req.get('Authorization') )
		return next(); //anonymous
	var authHeader = req.get('Authorization');
	authHeader = authHeader.split( ' ' );
	if ( authHeader.length != 2 || authHeader[0] !== "Bearer" )
		return next(); //anonymous
	var token = authHeader[1];

	this.jwt.parse( token )
	.then( this.loginHelper.lookup.bind(this.loginHelper) )
	.then( function(identity) {
		req.rem.identity = identity;
		next();
	})
	.catch(function(e) {
		console.log( "Authentication failed : " + e );
		res.status( 401 ).set('WWW-Authenticate','Bearer').send( "Not authorized." );
	});
};
Authenticator.prototype.router = function() {
	var router = express.Router();

	router.post( this.options.login_path, this.login.bind( this ) );
	if ( this.options.anonymous_signup )
		router.post( this.options.signup_path, this.signup.bind( this ) );
	
	router.use( this.authenticate.bind( this ) );

	//This route requires that we've already authenticated
	router.use( this.options.me_path, this.meRouter() );

	return router;
};

var createAuthenticator = function( resources, options ) {
	return new Authenticator( resources, options );
};

module.exports = createAuthenticator;
