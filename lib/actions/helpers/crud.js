module.exports = function( action, req, res, next ) {
	req.action = action;
	next();
};