var express = require('express');
var _ = require('lodash');
var REMOptions = require('./options');
var actions = require('./actions');

var REMResource = function(opt) {
	this.router   = express.Router();
	this.options = new REMOptions(this, opt);
	this.engine   = opt.engine
	this.db       = this.engine[this.options.name];
	this.plugins  = opt.plugins;
	this.children = [];

	if ( !opt.private )
	{
		_.forEach( actions, function( action, name ) {
			if ( !_.contains(this.options.forbid, name) )
			{
				if ( action.middleware )
					this.router.use( action.path, action.middleware.bind(this) );
				this.router[action.method]( action.path, action.handler.bind(null, this) );
			}
		}.bind(this))

		var child_middleware = require('./actions/helpers/save-id').bind(this);
		_.forEach( this.options.children, function(child_options, child_name) {
			child_options = _.extend({ name: child_name, engine: this.engine, plugins: this.plugins }, child_options);

			child_options.filter = child_options.filter || {};
			child_options.filter[this.options.makeForeignKey(this.options.name)] = function(resource, req) {
				return req.resource[this.options.name][this.options.id_key];
			}.bind(this)
			child_options.defaults = child_options.defaults || {};
			child_options.defaults[this.options.makeForeignKey(this.options.name)] = function(resource, req) {
				return req.resource[this.options.name][this.options.id_key];
			}.bind(this);

			child_options.immutable_keys = child_options.immutable_keys || [];
			child_options.immutable_keys.push( this.options.makeForeignKey(this.options.name) );

			this.children[child_name] = new REMResource(child_options);
			this.router.use( '/:id/' + child_name, child_middleware, this.children[child_name].router );
		}.bind(this))
	}
}

module.exports = REMResource;