var PasswordHelper = require('./password.js');
var stripPrivateProperties = require('../../actions/helpers/strip-private-properties');
var BPromise = require('bluebird');
var _ = require('lodash');

var LoginNotFoundError = function() {
	this.message = "Login does not exist.";
  this.name = "LoginNotFoundError";
  Error.captureStackTrace(this, LoginNotFoundError);
};
LoginNotFoundError.prototype = Object.create(Error.prototype);
LoginNotFoundError.prototype.constructor = LoginNotFoundError;

var LoginAlreadyExistsError = function() {
	this.message = "Login already exists.";
  this.name = "LoginAlreadyExistsError";
  Error.captureStackTrace(this, LoginAlreadyExistsError);
};
LoginAlreadyExistsError.prototype = Object.create(Error.prototype);
LoginAlreadyExistsError.prototype.constructor = LoginAlreadyExistsError;

var BadPasswordError = function() {
	this.message = "Bad login password.";
  this.name = "BadPasswordError";
  Error.captureStackTrace(this, BadPasswordError);
};
BadPasswordError.prototype = Object.create(Error.prototype);
BadPasswordError.prototype.constructor = BadPasswordError;


var LoginHelper = function(options, resources) {
	this.authority = _.clone( options.login_authority || { resource: 'users' } );
	if ( !this.authority.resource ) {
		throw new Error( "Bad login authority " + JSON.stringify( this.authority ) );
	}
	if ( !resources[this.authority.resource] )
	{
		console.log(resources);
		throw new Error( "No authority resource '" + this.authority.resource + "' found.");
	}
	this.authority.resource = resources[this.authority.resource];

	if ( !this.authority.type || this.authority.type == "basic" )
	{
		this.authority.login_property = this.authority.login_property || "username";
		this.authority.auth_property = this.authority.auth_property || "_auth";
	}
	// else if ( this.authority.type == "token" )
	// {
	// 	this.authority.token_property = this.authority.token_property || "_login_token";
	// }
	else
	{
		throw new Error( "Unknown authentication authority type '" + this.authority.type + "'");
	}

	this.password = new PasswordHelper(options);
};
LoginHelper.prototype.lookup = function( candidate, with_sensitive, callback ) {
	var query = {};
	if ( candidate._id )
		query._id = candidate._id;
	else	
		query[this.authority.login_property] = candidate.login;

	return this.authority.resource.db.findOne( query, {} )
	.bind(this)
	.then( function(docs) {
		if ( !docs )
		{
			throw new Error("No login records found.");
		}
		if ( _.isArray(docs) )
		{
			if ( docs.length != 1 )
			{
				throw new Error( "'" + docs.length + "' login records found." );
			}
			docs = docs[0];
		}
		return docs;
	})
	.catch( function(e) {
		throw new LoginNotFoundError();
	})
	.then( function(doc) {
		if ( with_sensitive !== true )
			doc = stripPrivateProperties( doc );
		return doc;
	})
	.bind().nodeify(callback);
};
LoginHelper.prototype.check = function( login, password, callback ) {
	var identity = null;
	return this.lookup( { login: login }, true )
	.bind(this)
	.catch( function( err ) {
		console.log( "Login error occurred: ", err );
		throw new Error( "Login error occurred." );
	})
	.then( function(id) {
		identity = id;
		var auth = identity[this.authority.auth_property];
		return this.password.encrypt( password, {
			salt: new Buffer( auth.salt, 'base64' ),
			iterations: auth.iterations
		});
	})
	.then( function(key) {
		var auth = identity[this.authority.auth_property];
		if ( key.key == auth.encrypted_password )
		{
			return stripPrivateProperties( identity );
		}
		else
		{
			console.log( "Bad password for user '%s'", login );
			throw new BadPasswordError();
		}
	})
	.bind().nodeify(callback);
};
LoginHelper.prototype.create = function( login, password, misc, callback ) {
	return this.lookup( { login: login } )
	.bind(this)
	.then( function() {
		throw new LoginAlreadyExistsError();
	})
	.catch( LoginNotFoundError, function() {
		return this.password.encrypt( password, {} )
			.catch( function(e) {
				console.log( "Failed to encrypt password...", e );
				throw new Error("Failed to create login.");
			});
	})
	.catch( function(e) {
		throw e;
	})
	.then( function(result) {
		console.log(result);
		var new_login = {};
		new_login[this.authority.login_property] = login;
		new_login[this.authority.auth_property] = {
			encrypted_password: result.key,
			salt: result.salt,
			iterations: result.iterations
		};
		return this.authority.resource.db.insert( new_login, {} )
			.then( function(newDoc) {
				return stripPrivateProperties( newDoc );
			})
			.catch( function(err) {
				console.log( "Failed to create login... ", err );
				throw new Error("Failed to create login.");
			});
	})
	.bind().nodeify(callback);
};
LoginHelper.prototype.update = function( login, old_password, new_password, misc, callback ) {
	var identity = null;

	return this.check( login, old_password )
	.bind(this)
	.then( function(id) {
		identity = id;
		return this.password.encrypt( new_password, {} );
	})
	.then( function(result) {
		var updated_login = {};
		updated_login[this.authority.auth_property] = {
			encrypted_password: result.key,
			salt: result.salt,
			iterations: result.iterations
		};
		return this.authority.resource.db.update( {'_id': identity._id}, { $set: updated_login }, {} )
			.then( function(numReplaced) {
				if ( numReplaced === 0 )
					throw new Error("Expected to replace exactly 1 document, %d documents replaced.", numReplaced);
				return numReplaced;
			})
			.catch( function(err) {
				console.log( "Error replacing login authority document: %s", err );
				throw new Error("Failed to update password.");
			});
	})
	.bind().nodeify(callback);
};

LoginHelper.prototype.reset = function( login, old_password, callback ) {
	var new_password = this.password.generate();
	return this.update( login, old_password, new_password, {} )
	.then( function() {
		console.log(new_password);
		return new_password;
	})
	.bind().nodeify(callback);
};

LoginHelper.LoginAlreadyExistsError = LoginAlreadyExistsError;
LoginHelper.LoginNotFoundError = LoginNotFoundError;
LoginHelper.BadPasswordError = BadPasswordError;

module.exports = LoginHelper;