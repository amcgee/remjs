var superagent = require('superagent')
var expect = require('expect.js')
var _ = require('lodash')
var REM = require('../index')

var fs = require('fs');
var path = require('path');

describe('REM.serve:', function(){
  var dir = "./data/serve_test";
  before(function() {
    REM.serve({
      dataDirectory: dir,
      version: "1.0",
      resources: {
        'employees': {},
        'departments': {
            children: ['employees']
        }
      }
    })
  })
  it('Make sure the employees database file was created.', function(){
    expect( fs.existsSync(path.join(dir, 'employees.db'))).to.be(true);
  })
  it('Make sure the departments database file was created.', function(){
    expect( fs.existsSync(path.join(dir, 'departments.db'))).to.be(true);
  })


})