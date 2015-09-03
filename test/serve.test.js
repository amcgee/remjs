var REM = require('../index');

var fs = require('fs');
var path = require('path');

describe('REM.serve:', function(){
  var dir = "./data/serve_test";

  before(function(done) {
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
    .delay(100)
    .then(function() {
      console.log("Created serve test files.");
      done();
    });
  });
  after(function() {
    fs.unlinkSync( path.join(dir, 'employees.db') );
    fs.unlinkSync( path.join(dir, 'departments.db') );
    fs.rmdirSync( dir );
    console.log("Deleted serve test files.");
  });

  it('Make sure the employees database file was created.', function(){
    fs.existsSync(path.join(dir, 'employees.db'))
      .should.eql(true);
  });
  it('Make sure the departments database file was created.', function(){
    fs.existsSync(path.join(dir, 'departments.db'))
      .should.eql(true);
  });
});
