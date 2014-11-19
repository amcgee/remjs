module.exports = {
	path: '/:id',
	method: 'get',
	middleware: require('./find-one'),
	handler: function(resource, req, res) {
		if ( !req.resource[resource.options.name] )
			res.status(500).send("This should never happen.");

		res.status(200).send(req.resource[resource.options.name]);
	}
}