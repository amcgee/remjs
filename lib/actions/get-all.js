var handler = function(resource, req, res) {
	var query = resource.options.buildQuery(req);
	resource.db.find(query)
		.exec(function (err, docs) {
			if ( err )
				return res.status(500).send("An unexpected error occurred.");
			else
				return res.status(200).send(docs);
		});
}

module.exports = {
	path: '/',
	method: 'get',
	handler: handler
}