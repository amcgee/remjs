var superagent = require('superagent');
var expect = require('expect.js');
var _ = require('lodash');
var scaffold = require('./test_scaffold');
var REM = require('../');
var influx = require('influx');
var BPromise = require('bluebird');

BPromise.promisifyAll(influx.InfluxDB.prototype);

var influxOptions = {
	hosts : [
    {
      host : 'localhost',
      port : 8086 //optional. default 8086
    }
  ],
  username : 'root',
  password : 'root'
};
var metaClient = influx(influxOptions);

var resources = {
	'sensors': {
		children: ['data']
	},
	'data': {
		engine: REM.engine.influxdb(influxOptions)
	}
};
var options = {};

scaffold.deploy('REM InfluxDB functionality.', resources, options, ['nedb'], function(scaffolding) {
	var url = scaffolding.baseURL();

	before(function(done) {
		metaClient.createDatabaseAsync( scaffolding.dbname )
			.catch(function(err) {
				throw "Failed to create test database.";
			})
			.then(function() {
				metaClient.options.database = scaffolding.dbname;
				resources.data.engine.db.options.database = scaffolding.dbname;
				return metaClient.writeSeriesAsync( {
					'data': [ {test: true}, {test: false} ]
				} )
				.then(function(data) {
					console.log(data);
				});
			})
			.then(function() {
				done();
			});
	});
	after(function(done) {
		metaClient.deleteDatabaseAsync( scaffolding.dbname )
		.finally( function() {
			done();
		});
	});
	
  it('fetch an empty collection of sensors', function(done){
  	superagent.get(url + '/sensors')
  		.end(function(e,res){
  			expect(e).to.eql(null);
  			expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be(0);
  			done();
  		});
  });

  it('fetch some data', function(done){
  	superagent.get(url + '/data')
  		.end(function(e,res){
  			expect(e).to.eql(null);
  			expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be(2);
  			done();
  		});
  });

});