var express = require('express');
var _ = require('lodash');
var REMOptions = require('./options');
var actions = require('./actions');

var REMResource = function(name, opt, parent) {
	this.router   = express.Router();
	this.name     = name;
	this.options = new REMOptions(this, opt, parent);
	
	this.engine   = opt.engine;
	if ( !this.engine )
	{
		if ( !parent )
			throw new Error("No engine specified for resource '" + this.name + "'.");
		else
			this.engine = parent.engine;
	}
	this.db       = this.engine[this.options.datasource]; // TODO: Robustify
	this.children = [];

	if ( !opt.private )
	{
		_.forEach( actions, function( action, action_name ) {
			if ( !_.contains(this.options.forbid, action_name) )
			{
				if ( action.middleware )
					this.router.use( action.path, action.middleware.bind(this) );
				this.router[action.method]( action.path, action.handler.bind(null, this) );
			}
		}.bind(this))

		var child_middleware = require('./actions/helpers/save-id').bind(this);
		_.forEach( this.options.children, function(child_options, child_name) {
			this.children[child_name] = new REMResource(child_name, child_options, this);
			this.router.use( '/:id/' + child_name, child_middleware, this.children[child_name].router );
		}.bind(this))
	}
}

module.exports = REMResource;