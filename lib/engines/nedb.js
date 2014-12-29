var _ = require('lodash');
var BPromise = require('bluebird');
var Datastore = require('nedb');
var path = require('path');
var events = require('events');

BPromise.promisifyAll(Datastore.prototype);

var NeDBCursor = function(original) {
	this.original = BPromise.promisifyAll(original);
};
NeDBCursor.prototype.limit = function(count) {
	this.original.limit(count);
	return this;
};
NeDBCursor.prototype.skip = function(count) {
	this.original.skip(count);
	return this;
};
NeDBCursor.prototype.sort = function(order) {
	this.original.sort(order);
	return this;
};
NeDBCursor.prototype.toArray = function(callback) {
	return this.original.execAsync()
		.nodeify(callback);
};
NeDBCursor.prototype.stream = function() {
	var stream = new events.EventEmitter();
	this.original.execAsync()
		.catch(function(e) {
			stream.emit('error', e);
		})
		.each(function(item) {
			stream.emit('data', item);
		})
		.then(function() {
			stream.emit('end');
		});
	return stream;
};

var NeDBCollection = function(file) {
	this.db = new Datastore({ filename: file, autoload: true });
};

NeDBCollection.prototype.findOne = function(query, projection, callback) {
	return this.db.findOneAsync(query, projection)
		.nodeify(callback);
};
NeDBCollection.prototype.find = function(query, projection) {
	return new NeDBCursor( this.db.find(query, projection) );
};
NeDBCollection.prototype.insert = function(obj, opt, callback) {
	return this.db.insertAsync(obj)
		.then(function(obj) {
			return [obj];
		})
		.nodeify(callback);
};
NeDBCollection.prototype.update = function(query, obj, opt, callback) {
	return this.db.updateAsync(query, obj, opt)
		.nodeify(callback);
};
NeDBCollection.prototype.remove = function(query, opt, callback) {
	return this.db.removeAsync(query, opt)
		.nodeify(callback);
};

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

		return new NeDBCollection(file);
	}
};

module.exports = function(options) {
	return new NeDBEngine(options);
};