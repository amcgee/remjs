module.exports = function(resource,req,res,next) {
	req.resource = req.resource || {};
	req.resource[resource.options.name] = {};
	req.resource[resource.options.name][resource.options.id_key] = req.params.id;
	next();
}