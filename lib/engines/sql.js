/* 
 * SQL ENGINE IS UNTESTED
 */

var _ = require('lodash');
var BPromise = require('bluebird');
var knex = require('knex');

var SQLCursor = function(original) {
	this.original = original;
};

SQLCursor.prototype.limit = function(count) {
	this.original.limit(count);
	return this;
};
SQLCursor.prototype.skip = function(count) {
	this.original.skip(count);
	return this;
};
SQLCursor.prototype.sort = function(order) {
	this.original.sort(order);
	return this;
};
SQLCursor.prototype.toArray = function(callback) {
	return this.original.toArrayAsync()
	.then(function(arr) {
		_.forEach(arr, function(obj) {
			stringifyID(obj);
		});
		return arr;
	})
	.nodeify(callback);
};
SQLCursor.prototype.stream = function() {
	var stream = this.original.stream();
	stream.on('data', function(obj) {
		stringifyID(obj);
	});
	return stream;
};

var SQLCollection = function(engine, name) {
	this.db = engine.db;
	this.table = name;
};

SQLCollection.prototype.findOne = function(query, projection, callback) {
	objectifyID( query );
	return this.db.findOneAsync(query, projection)
		.then(function(item) {
			if ( item )
				stringifyID(item);
			return item;
		})
		.nodeify(callback);
};
SQLCollection.prototype.find = function(query, projection) {
	var q = this.db;
	if ( projection )
		q.column( projectionToSelect(projection) );
	q.from(this.table);
	_.forEach( query, function(val, key) {
		if (key[0] == '$')
			return;
		q.where( key, val );
	});
	return new SQLCursor( q );
};
SQLCollection.prototype.insert = function(obj, opt, callback) {
	return this.db.insertAsync(obj, opt)
		.then(function(arr) {
			_.forEach(arr, function(item) {
				stringifyID(item);
			});
			return arr;
		})
		.nodeify(callback);
};
SQLCollection.prototype.update = function(query, obj, opt, callback) {
	objectifyID( query );
	return this.db.updateAsync(query, obj, opt)
		.nodeify(callback);
};
SQLCollection.prototype.remove = function(query, opt, callback) {
	objectifyID( query );
	console.log(query);
	return this.db.removeAsync(query, opt)
		.then(function(result) {
			if ( _.isArray(result) ) // What mongo setting causes this?
				result = result[0];
			return result;
		})
		.nodeify(callback);
};

var SQLEngine = function(options) {
	this.options = _.clone(options);
	this.db = this.options.db || null;
	this.collections = [];
};
SQLEngine.prototype.connect = function() {
	console.log('connect');
	this.db = knex(this.options);
			console.log('connected');
	
};
SQLEngine.prototype.collection = function(name) {
	if ( !this.collections[name] )
		this.collections[name] = new SQLCollection(this, name);
	return this.collections[name];
};

module.exports = function(options) {
	return new SQLEngine(options);
};