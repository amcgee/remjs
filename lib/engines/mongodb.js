var _ = require('lodash');
var BPromise = require('bluebird');
var mongodb = BPromise.promisifyAll(require('mongodb'));

var MongoEngine = function(options) {
	this.options = _.cloneDeep(options);
	this.db = null;
};
MongoEngine.prototype.connect = function() {
	this.db = new mongodb.Db(this.options.mongo.dbname, new mongodb.Server(this.options.mongo.host, this.options.mongo.port));
	return this.db.open()
	.catch(function(e) {
		throw new Error("Failed to connect to MongoDB.");
	})
	.bind(this)
	.then(function(db) {
		return BPromise.map( _.keys(this.options.resources), function(colName) {
		  return db.collection(colName, {strict:true})
		  .catch( function(e) {
		  	return db.createCollection(colName);
		  })
		  .catch( function(e) {
		  	throw new Error("Failed to create collection '" + colName + "'.");
		  });
		});
	})
	.then(function( cols ) {
		this.options.engine = cols;
	});
};

module.exports = MongoEngine;