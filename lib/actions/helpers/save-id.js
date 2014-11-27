module.exports = function(req, res, next) {
	req.rem.bound_id = req.rem.bound_id || {};
	req.rem.bound_id[this.name] = req.params.id;
	next();
};