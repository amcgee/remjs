module.exports = function(resource,req,res,next) {
	var query = resource.options.buildQuery(req);
	query[resource.options.id_key] = req.params.id;

	resource.db.find(query, function (err, docs) {
		if ( err )
			return res.status(500).send("An unexpected error occurred.");
		else if ( !docs || docs.length == 0 )
			return res.status(404).send("Resource not found.");
		else if ( docs.length != 1 )
			return res.status(500).send("This should never happen.");
		
		req.resource = req.resource || {};
		req.resource[resource.options.name] = docs[0];
		next();
	});
}