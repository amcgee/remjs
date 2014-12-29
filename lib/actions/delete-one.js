module.exports = {
	path: '/:id',
	method: 'delete',
	type: 'delete',
	handler: function(resource, req, res) {
		var query = resource.options.buildQuery(req);
		query[resource.options.id_key] = req.params.id;

		if ( !resource.db.remove )
		{
			return res.status(405).send("Method not allowed.");
		}

		resource.db.remove(query, {justone: true})
		.then(function(num) {
			if ( num === 0 )
				return res.status(404).send("Resource not found.");
			else if ( num !== 1 )
				return res.status(500).send("This should never happen.");

			return res.status(200).send("OK");
		})
		.catch(function (err) {
			return res.status(500).send(err);
		});
	}
};