var _ = require('lodash');
var BPromise = require('bluebird');
var influx = require('influx');
BPromise.promisifyAll(influx.InfluxDB.prototype);
var knex = require('knex');
var path = require('path');

var InfluxDBCursor = function(collection, sql) {
	this.collection = collection;
	this.sql = sql;
};

InfluxDBCursor.prototype.limit = function(count) {
	this.sql.limit(count);
	return this;
};
InfluxDBCursor.prototype.skip = function(count) {
	// unimplemented, but shouldn't fail
	// SHOULD THIS FAIL!?
	return this;
};
InfluxDBCursor.prototype.sort = function(order) {
	// unimplemented, but shouldn't fail
	return this;
};
InfluxDBCursor.prototype.toArray = function(callback) {
	return this.collection.db.queryAsync(this.sql.toString())
	.catch(function(err) {
		throw new Error("InfluxDB query failed : " + err);
	})
	.then(function(result) {
		if ( result.length !== 1 )
			throw new Error("Too many results for an InfluxDB query.");
		result = result[0].points;
		return result;
	})
	.nodeify(callback);
};

var InfluxDBCollection = function(engine, name) {
	this.db = engine.db;
	this.series = name;
	this.knex = knex({client:'websql'});
};

InfluxDBCollection.prototype.findOne = function(query, projection, callback) {
	var sql = this.knex.select().from(this.series).where(query);
	return this.db.queryAsync(sql.toString())
	.then(function(result) {
		console.log(result);
		return result;
	})
	.nodeify(callback);
};
InfluxDBCollection.prototype.find = function(query, projection) {
	var sql = this.knex.select().from(this.series).where(query);
	return new InfluxDBCursor(this, sql);
};

var InfluxDBEngine = function(options) {
	this.options = _.clone(options);
	this.db = influx(options);
	this.collections = [];
};
InfluxDBEngine.prototype.connect = function() {
	console.log('connect');
	this.db.getSeriesNamesAsync()
	.then(function(series) {
		console.log('connected');
	});
};
InfluxDBEngine.prototype.collection = function(name) {
	if ( !this.collections[name] )
		this.collections[name] = new InfluxDBCollection(this, name);
	return this.collections[name];
};

module.exports = function(options) {
	return new InfluxDBEngine(options);
};