var crypto = require( 'crypto' )

var PasswordHelper = function(options) {
	this.password_min_length = options.password_min_length || 6;
	this.key_length = options.password_key_length || 64;
	this.salt_size = options.password_salt_size || 64;
	this.default_iterations = options.password_pbkdf2_iterations || 10000;
};
PasswordHelper.prototype.encrypt = function( plaintext_password, options, cb ) {
	if ( !plaintext_password || plaintext_password.length < this.password_min_length )
		return cb( "Password does not meet the complexity requirements" );
	options = options || {};
	options.salt = options.salt || crypto.randomBytes(this.salt_size);
	options.iterations = options.iterations || this.default_iterations;

	crypto.pbkdf2( plaintext_password, options.salt, options.iterations, this.key_length, function( err, key ) {
		if ( err )
			return cb( err );
		return cb( null, key.toString( 'base64' ), options.salt.toString( 'base64' ), options.iterations );
	} );
}
PasswordHelper.prototype.generate = function() {
	return crypto.randomBytes(12).toString('base64');
}

module.exports = PasswordHelper;