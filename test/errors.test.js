var superagent = require('superagent');
var expect = require('expect.js');
var _ = require('lodash');
var scaffold = require('./test_scaffold');
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
    expect(function() {
      var rem = new REM(_.omit(options, 'version'));
    }).to.throwException();
  } );
  it( "Omit the engine", function() {
    expect(function() {
      var rem = new REM(_.omit(options, 'engine'));
    }).to.throwException();
  } );
} );
scaffold.deploy('REM rest api basic functionality (no schema validation):', resources, options, function(scaffolding){
	var url = scaffolding.baseURL();
	
  
});