var _ = require('lodash');

var REMOptions = function( resource, options ) {
	this.resource = resource;
	if ( !options.name )
		throw new Error( "Resource name not specified." );
	this.name = options.name;
	this.id_key         = options.id_key || '_id';
	this.filter         = options.filter || {};
	this.defaults       = options.defaults || {};
	this.immutable_keys = options.immutable_keys || {};
	this.children       = options.children || {};
	if (_.isArray(options.children))
		this.children = _.reduce(options.children, function(result, child) {
			result[child] = { name: child };
			return result;
		}, {});
	this.forbid = options.forbid || [];
}

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
	return query;
}
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
}
REMOptions.prototype.makeForeignKey = function(target) {
	return target + "_id"
}

module.exports = REMOptions;