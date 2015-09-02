var _ = require('lodash');

var REMOptions = function( resource, options, parent ) {
	this.resource = resource;
	this.datasource = options.datasource || resource.name;

	if ( parent )
		options = this.inherit( parent, options );
	this.id_key         = options.id_key || '_id';
	this.private        = options.private || false;
	this.filter         = options.filter || {};
	this.defaults       = options.defaults || {};
	this.immutable_keys = options.immutable_keys || {};
	this.children       = options.children || {};
	this.permissions    = options.permissions;
	if (_.isArray(options.children))
		this.children = _.reduce(options.children, function(result, child) {
			result[child] = { name: child };
			return result;
		}, {});
	this.forbid = options.forbid || [];
	this.type = options.type || 'resource';
};

REMOptions.prototype.inherit = function( parent, options ) {
	options.filter = options.filter || {};
	options.filter[parent.options.makeForeignKey(parent.name)] = function(resource, req) {
		return req.rem.bound_id[parent.name];
	}.bind(this);
	options.defaults = options.defaults || {};
	options.defaults[parent.options.makeForeignKey(parent.name)] = function(resource, req) {
		return req.rem.bound_id[parent.name];
	}.bind(this);

	options.immutable_keys = options.immutable_keys || [];
	options.immutable_keys.push( parent.options.makeForeignKey(parent.name) );
	return options;
};

REMOptions.prototype.buildQuery = function( req ) {
	var query = {};
	var resource = this.resource;
	_.forEach( this.filter, function( v, i ) {
		if ( _.isFunction(v) ) {
			query[i] = v(resource,req);
		} else {
			query[i] = v;
		}
	} );
	if ( req.rem.permission_filter )
		query = { $and: [ query, req.rem.permission_filter ] };
	return query;
};
REMOptions.prototype.buildDefaults = function(req) {
	var obj = {};
	var resource = this.resource;
	_.forEach( this.defaults, function( v, i ) {
		if ( _.isFunction(v) ) {
			obj[i] = v(resource,req);
		} else {
			obj[i] = v;
		}
	} );
	return obj;
};
REMOptions.prototype.checkImmutableKeys = function() {

};
REMOptions.prototype.makeForeignKey = function(target) {
	return target + "_id";
};

module.exports = REMOptions;
