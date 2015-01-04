var superagent = require('superagent');
var expect = require('expect.js');
var _ = require('lodash');
var scaffold = require('./test_scaffold');

var resources = {
  'employees': {},
  'departments': {
    children: ['employees']
  }
};
var options = {};

scaffold.deploy('REM rest api basic functionality (no schema validation):', resources, options, function(scaffolding){
	var url = scaffolding.baseURL();
	
  it('get the version', function(done){
    superagent.get(url + '/_version')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        console.log(scaffolding.options.version);
        expect(res.text).to.be.a('string');
        expect(res.text).to.eql(scaffolding.options.version);
        done();
      });
  });

  it('get the help text', function(done){
    superagent.get(url + '/_help')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.a('array');
        expect(res.body).to.eql(_.keys(scaffolding.options.resources));
        done();
      });
  });

  it('fetch an empty collection', function(done){
  	superagent.get(url + '/departments')
  		.end(function(e,res){
  			expect(e).to.eql(null);
  			expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be(0);
  			done();
  		});
  });

  var departmentName = "TPSReportDepartment";
  var departmentPurpose = "NONE";

  var departmentID = null;

  it('create new department', function(done){
    superagent.post(url + '/departments')
      .send({
        name: departmentName,
        purpose: departmentPurpose
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(201);
        expect(res.body).to.be.an('object');
        expect(res.body).not.to.be.an('array');
        departmentID = res.body._id;
        done();
      });
  });
  it('fetch new department', function(done){
    superagent.get(url + '/departments/' + departmentID)
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).not.to.be.an('array');
        expect(res.body._id).to.eql(departmentID);
        expect(res.body.name).to.eql(departmentName);
        expect(res.body.purpose).to.eql(departmentPurpose);
        done();
      });
  });

  it('fail to overwrite a non-existent department', function(done) {
    superagent.post(url + '/departments/abcdefghijk')
      .end(function(e, res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(404);
        done();
      });
  });

  it('fail to patch a non-existent department', function(done) {
    superagent.patch(url + '/departments/abcdefghijk')
      .end(function(e, res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(404);
        done();
      });
  });

  it('fail to delete a non-existent department', function(done) {
    superagent.del(url + '/departments/abcdefghijk')
      .end(function(e, res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(404);
        done();
      });
  });

  it('create new employee (no department)', function(done){
    superagent.post(url + '/employees')
      .send({
        'name': "useless mcgee",
        'DOB': new Date()
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(201);
        expect(res.body).to.be.an('object');
        expect(res.body).not.to.be.an('array');
        done();
      });
  });

  it('get the empty "TPSReportDepartment" employees list', function(done) {
    superagent.get(url + '/departments/' + departmentID + '/employees')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.eql(0);
        done();
      });
  });
  var employees = [];
  _.forEach( ['George Washington','Abraham Lincoln','Johnny Appleseed'], function(dummy_name) {
    it('add an employee', function(done){
      superagent.post(url + '/departments/' + departmentID + '/employees')
        .send({
          name: dummy_name
        })
        .end(function(e,res){
          expect(e).to.eql(null);
          expect(res.status).to.eql(201);
          expect(res.body).to.be.an('object');
          expect(res.body).not.to.be.an('array');
          expect(res.body.name).to.eql(dummy_name);
          expect(res.body.departments_id).to.eql(departmentID);
          employees.push(res.body._id);
          done();
        });
    });
  });

  it('check that all the employees show up', function(done) {
    superagent.get(url + '/departments/' + departmentID + '/employees')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.eql(employees.length);
        var ticklist = _.clone(employees);
        _.forEach( res.body, function( employee, i ) {
          ticklist = _.without( ticklist, employee._id );
        } );
        expect(ticklist.length).to.eql(0);
        done();
      });
  });

  it('try getting an employee individually', function(done) {
    superagent.get(url + '/departments/' + departmentID + '/employees/' + employees[0])
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).not.to.be.an('array');
        expect(res.body._id).to.eql(employees[0]);
        expect(res.body.departments_id).to.eql(departmentID);
        done();
      });
  });

  it('try to create an employee and overwrite departments_id (should fail)', function(done) {
    superagent.post(url + '/departments/' + departmentID + '/employees')
      .send({
        name: 'BOGUS',
        departments_id: 'HAXORS'
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(400);
        done();
      });
  });

  it('update an employee but try to override the immutable department id (patch)', function(done) {
    superagent.patch(url + '/departments/' + departmentID + '/employees/' + employees[0])
      .send({
        departments_id: 'HAXORS'
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(400);
        done();
      });
  });

  it('update an employee but try to override the immutable department id (post)', function(done) {
    superagent.post(url + '/departments/' + departmentID + '/employees/' + employees[0])
      .send({
        departments_id: 'HAXORS'
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(400);
        done();
      });
  });

  it('update an employee but with an OK override (patch)', function(done) {
    superagent.post(url + '/departments/' + departmentID + '/employees/' + employees[0])
      .send({
        name: 'Appleseed'
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        done();
      });
  });

  it('update an employee but actually override the whole thing (post)', function(done) {
    superagent.post(url + '/employees/' + employees[0])
      .send({
        departments_id: departmentID,
        name: 'Fruitsprout'
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        done();
      });
  });

  it('delete the employees', function(done) {
    _.forEach( employees, function( employee_id ) {
      superagent.del(url + '/departments/' + departmentID + '/employees/'+ employee_id)
        .end(function(e,res){
          expect(e).to.eql(null);
          expect(res.status).to.eql(200);
          employees = _.without( employees, employee_id );
          if ( employees.length === 0 )
            done();
        });
    });
  });
  it('get the empty employees list again', function(done) {
    superagent.get(url + '/departments/' + departmentID + '/employees')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.eql(0);
        done();
      });
  });

  it('delete the department', function(done){
    superagent.del(url + '/departments/' + departmentID)
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        done();
      });
  });

  it('fetch the non-existent deleted department (should fail)', function(done){
    superagent.get(url + '/departments/' + departmentID)
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(404);
        done();
      });
  });
});