var _ = require('lodash');
var BPromise = require('bluebird');
var knex = require('knex');

var SQLCursor = function(collection, sql) {
    this.collection = collection;
    this.sql = sql;
};

SQLCursor.prototype.limit = function(count) {
    this.sql.limit(count);
    return this;
};
SQLCursor.prototype.skip = function(count) {
    this.sql.offset(count);
    return this;
};
SQLCursor.prototype.sort = function() {
    // unimplemented, but shouldn't fail
    // TODO
    return this;
};
SQLCursor.prototype.toArray = function(callback) {
    return this.sql
    .catch(function(err) {
        throw new Error("SQL query failed : " + err);
    })
    .then(function(result) {
        if ( result.length !== 1 ) {
            throw new Error("Too many results for an SQL query.");
        }
        result = result[0].points;
        return result;
    })
    .nodeify(callback);
};

var SQLCollection = function(engine, name) {
    this.series = name;
    this.knex = engine.db(name);
};

SQLCollection.prototype.findOne = function(query, projection, callback) {
    var sql = this.knex.select().from(this.series).where(query);
    return sql
    .then(function(result) {
        console.log(result);
        return result;
    })
    .nodeify(callback);
};
SQLCollection.prototype.find = function(query) {
    var sql = this.knex.select().from(this.series).where(query);
    return new SQLCursor(this, sql);
};

var SQLEngine = function(options) {
    this.options = _.clone(options);
    this.db = knex(this.options);
    this.collections = [];
};
SQLEngine.prototype.connect = function() {
    return BPromise.delay(this, 1);
};
SQLEngine.prototype.collection = function(name) {
    if ( !this.collections[name] ) {
        this.collections[name] = new SQLCollection(this, name);
    }
    return this.collections[name];
};

module.exports = function(options) {
    return new SQLEngine(options);
};
