var _ = require('lodash');

var PermissionsManager = function(resource) {
	this.resource = resource;
	if ( !resource.options.permissions )
	{
		this.defaults = this.annonymous_permissions = ['create','read','update','delete'];
	}
	else
	{
		this.defaults               = resource.options.permissions.defaults || ['create','read','update','delete'];
		this.annonymous_permissions = resource.options.permissions.annonymous || [];
	}
};
PermissionsManager.prototype.apply = function(action, req, res, next) {
	var annonymous = !req.rem.identity;
	var permissions = ( annonymous )? this.annonymous_permissions : this.defaults;
	if ( _.isArray(permissions) && _.contains( permissions, action ) ) {
		return next();
	} else if ( _.isObject(permissions) && _.has( permissions, action ) ) {
		var permiss = permissions[action];
		if ( _.isFunction( permiss ) )
			permiss = permiss(req.rem.identity);

		if ( _.isObject( permiss ) )
		{
			req.rem.permission_filter = permiss;
			return next();
		}
		else if ( permiss ) //test truthiness
		{
			return next();
		}
	}

	if ( annonymous )
		return res.status(401).set('WWW-Authenticate','Bearer').send("Unauthorized.");
	else
		return res.status(403).send("Insufficient permissions.");
};

module.exports = PermissionsManager;