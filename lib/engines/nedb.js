var _ = require('lodash');
var BPromise = require('bluebird');
var Datastore = require('nedb');
var path = require('path');

var NeDBEngine = function(options) {
	this.options = _.cloneDeep(options || {});
	this.dbs = {};
	if ( !this.options.dbFiles && !this.options.rootDirectory )
		throw new Error("No database files specified for NeDB engine.");

	_.forEach( this.options.dbFiles, function(file, name) {
		this.dbs[name] = this._create( name, file );
	}.bind(this));
};
NeDBEngine.prototype.collection = function(name) {
	if ( !this.dbs[name] )
		this.dbs[name] = this._create( name );
	return this.dbs[name];
};
NeDBEngine.prototype._create = function( name, file ) {
	if ( !file && this.options.createCollection ) {
		return this.options.createCollection( name );
	}
	else
	{
		if ( !file ) {
			if ( !this.options.rootDirectory )
				throw new Error( "Unknown collection specified and no NeDB root directory specified." );
			file = path.join( this.options.rootDirectory, name + '.db' );
		}

		return new Datastore({ filename: file, autoload: true });
	}
};


module.exports = function(options) {
	return new NeDBEngine(options);
};