var scaffold = require('./test_scaffold');
var should = scaffold.should;
var _ = require('lodash');
var REM = require('../index');

var resources = {
  'employees': {},
  'departments': {
    children: ['employees']
  }
};

var options = {
  version: '1.0',
  resources: resources,
  engine: REM.engine.nedb({
    dbFiles: []
  })
};

describe( "REM initializations with bad options.", function() {
  it( "Omit the version", function() {
    should.Throw(function() {
      var rem = new REM(_.omit(options, 'version'));
    });
  } );
  it( "Omit the engine", function() {
    should.Throw(function() {
      var rem = new REM(_.omit(options, 'engine'));
    });
  } );
} );

scaffold.deploy('REM rest api basic functionality (no schema validation):', resources, options, function(scaffolding, agent){
    
});