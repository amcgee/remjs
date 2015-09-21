var crypto = require( 'crypto' );
var BPromise = require( 'bluebird' );

var PasswordHelper = function(options) {
    this.password_min_length = options.password_min_length || 6;
    this.key_length = options.password_key_length || 64;
    this.salt_size = options.password_salt_size || 64;
    this.default_iterations = options.password_pbkdf2_iterations || 10000;
};

PasswordHelper.prototype.encrypt = function( plaintext_password, options ) {
    return BPromise.try( function() {
        if ( !plaintext_password || plaintext_password.length < this.password_min_length ) {
            throw new Error( "Password does not meet the complexity requirements" );
        }
        options = options || {};
        options.salt = options.salt || crypto.randomBytes(this.salt_size);
        options.iterations = options.iterations || this.default_iterations;
        return options;
    }.bind(this) )
    .bind(this)
    .then( function(options) {
        var pbkdf2 = BPromise.promisify(crypto.pbkdf2);
        return pbkdf2(
        plaintext_password, options.salt, options.iterations, this.key_length );
    })
    .then( function(key) {
        return {
            key: key.toString( 'base64' ),
            salt: options.salt.toString( 'base64' ),
            iterations: options.iterations
        };
    });
};

PasswordHelper.prototype.generate = function() {
    return crypto.randomBytes(12).toString('base64');
};

module.exports = PasswordHelper;
