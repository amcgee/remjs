var _ = require('lodash');
var BPromise = require('bluebird');
var mongodb = BPromise.promisifyAll(require('mongodb'));
BPromise.promisifyAll(mongodb.Cursor.prototype);

var objectifyID = function( obj ) {
	if ( obj._id && !(obj._id instanceof mongodb.ObjectID) )
	{
		if ( obj._id.length != 12 && obj._id.length != 24 )
			throw new Error("Invalid object ID " + obj._id );
		obj._id = mongodb.ObjectID(obj._id);
	}
};
var stringifyID = function( obj ) {
	if ( obj._id && (obj._id instanceof mongodb.ObjectID) )
		obj._id = obj._id.toString();
};

var MongoCursor = function(original) {
	this.original = original;
};
MongoCursor.prototype.limit = function(count) {
	this.original.limit(count);
	return this;
};
MongoCursor.prototype.skip = function(count) {
	this.original.skip(count);
	return this;
};
MongoCursor.prototype.sort = function(order) {
	this.original.sort(order);
	return this;
};
MongoCursor.prototype.toArray = function(callback) {
	return this.original.toArrayAsync()
	.then(function(arr) {
		_.forEach(arr, function(obj) {
			stringifyID(obj);
		});
		return arr;
	})
	.nodeify(callback);
};
MongoCursor.prototype.stream = function() {
	var stream = this.original.stream();
	stream.on('data', function(obj) {
		stringifyID(obj);
	});
	return stream;
};

var MongoCollection = function(engine, name) {
	this.db = engine.db.collection(name);
};

MongoCollection.prototype.findOne = function(query, projection, callback) {
	objectifyID( query );
	return this.db.findOneAsync(query, projection)
		.then(function(item) {
			if ( item )
				stringifyID(item);
			return item;
		})
		.nodeify(callback);
};
MongoCollection.prototype.find = function(query, projection) {
	objectifyID( query );
	return new MongoCursor( this.db.find(query, projection) );
};
MongoCollection.prototype.insert = function(obj, opt, callback) {
	return this.db.insertAsync(obj, opt)
		.then(function(arr) {
			_.forEach(arr, function(item) {
				stringifyID(item);
			});
			return arr;
		})
		.nodeify(callback);
};
MongoCollection.prototype.update = function(query, obj, opt, callback) {
	objectifyID( query );
	return this.db.updateAsync(query, obj, opt)
		.nodeify(callback);
};
MongoCollection.prototype.remove = function(query, opt, callback) {
	objectifyID( query );
	console.log(query);
	return this.db.removeAsync(query, opt)
		.then(function(result) {
			return result[0];
		})
		.nodeify(callback);
};

var MongoEngine = function(options) {
	this.options = _.clone(options);
	this.db = this.options.db || null;
	this.collections = [];
};
MongoEngine.prototype.connect = function() {
	console.log('connect');
	if ( this.db )
		return BPromise.delay(this, 1);

	this.db = new mongodb.Db(this.options.dbname, new mongodb.Server(this.options.host, this.options.port), {safe:true});
	return this.db.openAsync()
	.catch(function(e) {
		throw new Error("Failed to connect to MongoDB.");
	})
	.bind(this)
	.then(function(db) {
		BPromise.map( _.keys(this.options.resources), function(colName) {
		  return db.collectionAsync(colName, {strict:true})
		  .catch( function(e) {
		  	return db.createCollectionAsync(colName);
		  })
		  .catch( function(e) {
		  	throw new Error("Failed to create collection '" + colName + "'.");
		  });
		})
		.then(function() {
			console.log('connected');
		})
		.return(this);
	});
};
MongoEngine.prototype.collection = function(name) {
	if ( !this.collections[name] )
		this.collections[name] = new MongoCollection(this, name);
	return this.collections[name];
};

module.exports = function(options) {
	return new MongoEngine(options);
};