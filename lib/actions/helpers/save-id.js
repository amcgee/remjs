module.exports = function(req, res, next) {
	req.resource = req.resource || {};
	req.resource[this.options.name] = {};
	req.resource[this.options.name][this.options.id_key] = req.params.id;
	next();
}