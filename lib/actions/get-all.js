var applyModifiers = require('../modifiers' );
var _ = require('lodash');
var stripPrivateProperties = require('./helpers/strip-private-properties.js');

var handler = function(resource, req, res) {
	if ( !resource.db.find )
	{
		return res.status(405).send("Method not allowed.");
	}

	var opts = {
		query: resource.options.buildQuery(req)
	};
	
	opts = applyModifiers( opts, req );
	var cursor = resource.db.find(opts.query, opts.projection);
	cursor = opts.before( cursor );
	cursor.toArray(function (err, docs) {
		if ( err )
			return res.status(500).send("An unexpected error occurred.");
		else
		{
			docs = opts.after( docs );
			docs = _.map( docs, stripPrivateProperties );
			return res.status(200).send(docs);
		}
	});
};

module.exports = {
	path: '/',
	method: 'get',
	type: 'read',
	handler: handler
};