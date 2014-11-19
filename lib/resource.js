var express = require('express');
var _ = require('lodash');
var bodyParser = require('body-parser');
var REMOptions = require('./options');
var resourceActions = require('./resource-actions');

var REMResource = function(opt) {
	console.log(opt);
	var router   = express.Router();
	this.options = new REMOptions(this, opt);
	this.engine   = opt.engine
	this.db       = this.engine[this.options.name];

	router.use( bodyParser.json() );

	var resource = this;
	_.forEach( resourceActions, function( action, name ) {
		if ( !_.contains(resource.options.forbid, name) )
		{
			if ( action.middleware )
				router.use( action.path, action.middleware.bind(null, resource) );
			router[action.method]( action.path, action.handler.bind(null, resource) );
		}
	})

	_.forEach( this.options.children, function(child_options, child_name) {
		child_options = _.extend({ name: child_name, engine: this.engine }, child_options);

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

		router.use( '/:id/' + child_name, require('./actions/find-one').bind(null,this), new REMResource(child_options) );
	}.bind(this))

	return router;
}

module.exports = REMResource;