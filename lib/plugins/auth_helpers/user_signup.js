var signupHelper = function( candidate, authority ) {
	var query = {};
	query[authority.login_property] = candidate.login;

	authority.resource.engine.find( query, function(err, docs) {
		if ( err || !docs )
		{
			return res.status( 403 ).send( "Invalid username or password." );
		}
		if ( docs.length != 1 )
		{
			console.log( "Login query failed, %d records returned.", docs.length );
			return res.status( 403 ).send( "Invalid username or password." );
		}
		var auth = docs[0][authority.auth_property];
		this.password.encrypt( candidate.password, {
			salt: auth.salt,
			iterations: auth.iterations
		}, function( err, key ) {
			if ( key == auth.encrypted_password )
				return res.status( 200 ).send( this.jwt.create() );
			else
			{
				console.log( "Bad password for user '%s'", candidate.login );
				return res.status( 403 ).send( "Invalid username or password." );
			}
		});
	}.bind(this));
};