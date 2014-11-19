var _ = require('lodash');

var handler = function(resource, req, res) {
	var badKeys = _.reduce( resource.options.immutable_keys, function( result, key ) {
		if ( _.has( req.body, key) )
			result.push( key );
		return result;
	}, []);
	if ( badKeys.length > 0 )
		return res.status(400).send("The following keys are immutable: " + badKeys.join( ", " ) );
	var obj = _.extend( resource.options.buildDefaults(req), req.body );

	resource.db.insert(obj, function (err, newDoc) {
		if ( err ) {
			if ( err.errorType == 'uniqueViolated' )
				return res.status(400).send("Unique constraint violoted.");
			console.log( "Error occurred creating resource, err: %s", err.errorType );
			return res.status(500).send("Something bad happened...");
		}
		console.log( "Successfully created document with ID '%s'", newDoc._id );
		res.status(201).send(newDoc);
	});
}

module.exports = {
	path: '/',
	method: 'post',
	handler: handler
}