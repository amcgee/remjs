var PasswordHelper = require('./password.js')
var stripPrivateProperties = require('../../actions/helpers/strip-private-properties');

var LoginHelper = function(options, resources) {
	this.authority = options.login_authority || { resource: 'users' };
	if ( !this.authority.resource ) {
		throw new Error( "Bad login authority " + JSON.stringify( this.authority ) );
	}
	if ( !resources[this.authority.resource] )
	{
		throw new Error( "No authority resource found.")
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
		throw new Error( "Unknown authentication authority type '" + this.authority.type + "'")
	}

	this.password = new PasswordHelper(options);
}
LoginHelper.prototype.lookup = function( candidate, cb, with_sensitive ) {
	var query = {};
	if ( candidate['_id'] )
		query['_id'] = candidate['_id']
	else	
		query[this.authority.login_property] = candidate.login;

	this.authority.resource.db.find( query, function(err, docs) {
		if ( err || !docs )
		{
			return cb( "Not found. Error: " + err )
		}
		if ( docs.length != 1 )
		{
			return cb( "Not found. Error: '" + docs.length + "' records returned." )
		}
		if ( with_sensitive !== true )
			docs[0] = stripPrivateProperties( docs[0] )
		cb( null, docs[0] );
	} );
}
LoginHelper.prototype.check = function( login, password, cb ) {
	this.lookup( { login: login }, function( err, identity ) {
		if ( err )
		{
			console.log( "Login error occurred: ", err );
			return cb( "Login error occurred." );	
		}
		var auth = identity[this.authority.auth_property];
		this.password.encrypt( password, {
			salt: new Buffer( auth.salt, 'base64' ),
			iterations: auth.iterations
		}, function( err, key ) {
			if ( key == auth.encrypted_password )
			{
				return cb( null, stripPrivateProperties( identity ) );
			}
			else
			{
				console.log( "Bad password for user '%s'", login );
				return cb( "Invalid password." )
			}
		} )
	}.bind(this), true )
}
LoginHelper.prototype.create = function( login, password, misc, cb ) {
	this.lookup( { login: login }, function( err, found_identity ) {
		if ( !err && found_identity )
		{
			return cb("That login already exists.");
		}
		this.password.encrypt( password, {}, function( err, key, salt, iterations ) {
			if ( err ) {
				console.log( "Failed to encrypt password..." );
				return cb("Failed to create login.");
			}

			var new_login = {};
			new_login[this.authority.login_property] = login;
			new_login[this.authority.auth_property] = {
				encrypted_password: key,
				salt: salt,
				iterations: iterations
			}
			this.authority.resource.db.insert( new_login, function( err, newDoc ) {
				if ( err || !newDoc )
				{
					console.log( "Failed to create login... ", err );
					return cb("Failed to create login.");
				}
				newDoc = stripPrivateProperties( newDoc );
				return cb(null, newDoc);
			})
		}.bind(this) )
	}.bind(this) );
}
LoginHelper.prototype.update = function( login, old_password, new_password, misc, cb ) {
	this.check( login, old_password, function(err,id) {
		if ( err ) {
			return cb(err);
		}
		this.password.encrypt( new_password, {}, function( err, key, salt, iterations ) {
			if ( err ) {
				console.log( "Failed to encrypt password..." );
				return cb("Failed to update password.");
			}

			var updated_login = {};
			updated_login[this.authority.auth_property] = {
				encrypted_password: key,
				salt: salt,
				iterations: iterations
			}
			this.authority.resource.db.update( {'_id': id['_id']}, { $set: updated_login }, {}, function(err,numReplaced) {
				if ( err || numReplaced == 0 )
				{
					console.log( "Error replacing %d documents: %s", numReplaced, err );
					return cb("Failed to update password.");
				}

				return cb();
			})
		}.bind(this))
	}.bind(this) )
}

LoginHelper.prototype.reset = function( login, old_password, cb ) {
	var new_password = this.password.generate();
	this.update( login, old_password, new_password, {}, function(err) {
		if ( err ) {
			return cb(err);
		}
		cb(null, new_password);
	} );
}

module.exports = LoginHelper;