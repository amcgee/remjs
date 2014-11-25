module.exports = function(req, res, next) {
	req.resource = req.resource || {};
	req.resource[this.name] = {};
	req.resource[this.name][this.options.id_key] = req.params.id;
	next();
}