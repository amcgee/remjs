var _ = require('lodash');
var stripPrivateProperties = require('./helpers/strip-private-properties.js');

var handler = function(req, res) {
	if ( !_.isObject( req.body ) ) {
		res.status(400).send("Invalid request body.");
	}
	if ( !req.rem.db.findOne || !req.rem.db.update )
	{
		return res.status(405).send("Method not allowed.");
	}

	req.body = stripPrivateProperties( req.body );
	var keys = _.keys(req.body);
	var badKeys = _.union(
		_.intersection(req.rem.resource.options.immutable_keys, keys)
	);

	if ( badKeys.length > 0 )
		return res.status(400).send("The following properties are immutable: " + badKeys.join( ", " ) );
	var obj = _.extend( req.rem.resource.options.buildDefaults(req), req.body );

	var query = req.rem.resource.options.buildQuery(req);
	query[req.rem.resource.options.id_key] = req.params.id;

	req.rem.db.findOne(query, {})
	.then( function( doc ) {
		return req.rem.db.update({ _id: doc._id }, { $set: obj }, {})
		.then(function(numReplaced) {
			if ( numReplaced === 0 )
			{
				res.status(404).send("Resource update failed.");
			}
			else
			{
				console.log( "Successfully updated document with ID '%s'", req.params.id );
				res.status(200).send("OK");
			}
		})
		.catch(function(err) {
			if ( err.errorType == 'uniqueViolated' ) {
				res.status(400).send("Unique constraint violoted.");
			} else {
				console.log( "Error occurred updating resource, err: %s", err );
				res.status(500).send("Something bad happened...");
			}
		});
	})
	.catch(function() {
		res.status(404).send("Resource does not exist.");
	});
};

module.exports = {
	path: '/:id',
	method: 'patch',
	type: 'update',
	handler: handler
};