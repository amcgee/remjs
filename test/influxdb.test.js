var scaffold = require('./test_scaffold');
var _ = require('lodash');
var REM = require('../');
var influx = require('influx');

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
		type: 'container',
		engine: REM.engine.influxdb(influxOptions)
	}
};
var options = {};

scaffold.deploy('REM InfluxDB functionality.', resources, options, ['nedb'], function(scaffolding, agent) {
	before(function(done) {
		metaClient.createDatabaseAsync( scaffolding.dbname )
			.catch(function(err) {
				throw "Failed to create test database.";
			})
			.then(function() {
				metaClient.options.database = scaffolding.dbname;
				resources.data.engine.db.options.database = scaffolding.dbname;
				return metaClient.writeSeriesAsync( {
					'a': [ {test: true}, {test: false} ],
					'b': [ {test: true} ]
				} )
				.then(function(data) {
					console.log(data);
				});
			})
			.finally(function() {
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
  	agent
      .get('/sensors')
  		.expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(0);
      })
  		.end(done);
  });

  it('fetch some data', function(done){
  	agent
      .get('/data/a')
  		.expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(2);
      })
  		.end(done);
  });
  it('fetch some data', function(done){
  	agent
      .get('/data/b')
  		.expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(1);
      })
  		.end(done);
  });

  it('try posting (should fail)', function(done){
  	agent
      .post('/data/a')
      .send({
        bogus: true
      })
  		.expect(405)
      .end(done);
  });
  it('test limiting', function(done){
    agent
      .get('/data/a?limit=1')
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(1);
      })
      .end(done);
  });
  it('test skipping (unimplemented, but should succeed)', function(done){
    agent
      .get('/data/a?skip=1')
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(2);
      })
      .end(done);
  });

  it('test sorting (unimplemented, but should succeed)', function(done){
    agent
      .get('/data/a?sort=test')
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(2);
      })
      .end(done);
  });
});