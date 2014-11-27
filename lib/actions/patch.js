var _ = require('lodash');
var stripPrivateProperties = require('./helpers/strip-private-properties.js');

var handler = function(resource, req, res) {
	if ( !_.isObject( req.body ) ) {
		res.status(400).send("Invalid request body.");
	}

	req.body = stripPrivateProperties( req.body );
	var keys = _.keys(req.body);
	var badKeys = _.union(
		_.intersection(resource.options.immutable_keys, keys)
	);

	if ( badKeys.length > 0 )
		return res.status(400).send("The following properties are immutable: " + badKeys.join( ", " ) );
	var obj = _.extend( resource.options.buildDefaults(req), req.body );

	var query = resource.options.buildQuery(req);
	query[resource.options.id_key] = req.params.id;

	resource.db.update(query, { $set: obj }, {}, function (err, numReplaced) {
		if ( err ) {
			if ( err.errorType == 'uniqueViolated' )
				return res.status(400).send("Unique constraint violoted.");
			console.log( "Error occurred creating resource, err: %s", err.errorType );
			return res.status(500).send("Something bad happened...");
		}
		if ( numReplaced === 0 )
			return res.status(404).send("Resource does not exist.");
		console.log( "Successfully updated document with ID '%s'", req.params.id );
		res.status(200).send("OK");
	});
};

module.exports = {
	path: '/:id',
	method: 'patch',
	type: 'update',
	handler: handler
};