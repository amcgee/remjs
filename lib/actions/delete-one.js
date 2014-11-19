module.exports = {
	path: '/:id',
	method: 'delete',
	handler: function(resource, req, res) {
		var query = resource.options.buildQuery(req);
		query[resource.options.id_key] = req.params.id;

		resource.db.remove(query, {}, function(err, num) {
			if ( err )
				return res.status(500).send(err);
			else if ( num == 0 )
				return res.status(404).send("Resource not found.");
			else if ( num != 1 )
				return res.status(500).send("This should never happen.");

			return res.status(200).send("OK");
		})
	}
}