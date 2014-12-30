var applyModifiers = require('../modifiers');
var _ = require('lodash');
var stripPrivateProperties = require('./helpers/strip-private-properties.js');

module.exports = {
	path: '/:id',
	method: 'get',
	type: 'read',
	middleware: require('./helpers/save-id'),
	handler: function(req, res) {
		if ( !req.rem.db.find )
		{
			return res.status(405).send("Method not allowed.");
		}
		var query = req.rem.resource.options.buildQuery(req);
		query[req.rem.resource.options.id_key] = req.params.id;

		var opts = {
			query: query
		};

		opts = applyModifiers( opts, req );

		var cursor = req.rem.db.find(opts.query, opts.projection );
		cursor = opts.before(cursor);
		cursor.toArray( function (err, docs) {
			if ( err )
				return res.status(500).send("An unexpected error occurred.");
			else if ( !docs || docs.length === 0 )
				return res.status(404).send("Resource not found.");
			else if ( docs.length !== 1 )
				return res.status(500).send("This should never happen.");
			
			docs = opts.after( docs );
			docs = _.map( docs, stripPrivateProperties );
			res.status(200).send(docs[0]);
		});
	}
};