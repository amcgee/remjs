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

scaffold.deploy('REM modifiers (fields, sort, limit, skip):', resources, options, function(scaffolding){
	var url = scaffolding.baseURL();
	
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

  var employees = [];
  _.forEach( ['President George Washington','President Abraham Lincoln','Dude Johnny Appleseed'], function(dummy_name) {
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

  it('get all employees, sorted ascending by name', function(done) {
    superagent.get(url + '/departments/' + departmentID + '/employees?sort=name')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.eql(employees.length);

        var lastName = res.body[0].name;
        var i = 1;
        while ( i < res.body.length )
        {
          expect(res.body[i].name).to.be.greaterThan(lastName);
          lastName = res.body[i].name;
          i += 1;
        }
        done();
      });
  });

  it('get all employees, sorted descending by name', function(done) {
    superagent.get(url + '/departments/' + departmentID + '/employees?sort=-name')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.eql(employees.length);
        
        var lastName = res.body[0].name;
        var i = 1;
        while ( i < res.body.length )
        {
          expect(res.body[i].name).to.be.lessThan(lastName);
          lastName = res.body[i].name;
          i += 1;
        }
        done();
      });
  });

  var twoEmployees = null;
  it('try getting just 2 employees (using limit, sort)', function(done) {
    superagent.get(url + '/departments/' + departmentID + '/employees?sort=name&limit=2')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.eql(2);

        twoEmployees = res.body;
        done();
      });
  });

  it('try getting the second 2 employees (using limit, sort, and skip)', function(done) {
    superagent.get(url + '/departments/' + departmentID + '/employees?sort=name&limit=2&skip=1')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.eql(2);

        expect(res.body[0].name).to.eql(twoEmployees[1].name);
        expect(res.body[1].name).not.to.eql(twoEmployees[0].name);

        done();
      });
  });

  var commonName = "A John Smith";
  it('add two employees with the same name but different titles', function(done){
    // These start with A so they are the first two in the limit below.
    superagent.post(url + '/employees')
      .send({
        name: commonName,
        title: "Director"
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(201);
        expect(res.body).to.be.an('object');
        expect(res.body).not.to.be.an('array');
        expect(res.body.name).to.eql(commonName);
        expect(res.body.title).to.eql("Director");
        employees.push(res.body._id);
        superagent.post(url + '/employees')
          .send({
            name: commonName,
            title: "Janitor"
          })
          .end(function(e,res){
            expect(e).to.eql(null);
            expect(res.status).to.eql(201);
            expect(res.body).to.be.an('object');
            expect(res.body).not.to.be.an('array');
            expect(res.body.name).to.eql(commonName);
            expect(res.body.title).to.eql("Janitor");
            employees.push(res.body._id);
            done();
          });
      });
  });

  it('try getting those 2 employees (using multiple column sort)', function(done) {
    superagent.get(url + '/employees?limit=2&sort=name,title')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.eql(2);

        expect(res.body[0].name).to.eql(commonName);
        expect(res.body[1].name).to.eql(commonName);

        expect(res.body[0].title).to.eql("Director");
        expect(res.body[1].title).to.eql("Janitor");

        done();
      });
  });

  it('try getting those 2 employees in reverse title order (again using multiple column sort)', function(done) {
    superagent.get(url + '/employees?limit=2&sort=name,-title')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.eql(2);

        expect(res.body[0].name).to.eql(commonName);
        expect(res.body[1].name).to.eql(commonName);

        expect(res.body[0].title).to.eql("Janitor");
        expect(res.body[1].title).to.eql("Director");

        done();
      });
  });

  it('try getting all the employees, but only the "name" field (no _id, title or location)', function(done) {
    superagent.get(url + '/employees?fields=name')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        
        _.forEach( res.body, function( employee ) {
          expect( _.keys( employee ).length ).to.eql(1);
          expect( _.keys( employee )[0] ).to.eql("name");
        });

        done();
      });
  });

  it('try getting all the employees, but only the "name" and "_id" fields (no location or title)', function(done) {
    superagent.get(url + '/employees?fields=name,_id')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        
        _.forEach( res.body, function( employee ) {
          expect( _.keys( employee ).length ).to.eql(2);
          expect( _.has(employee, "_id") ).to.be(true);
          expect( _.has(employee, "name") ).to.be(true);
        });

        done();
      });
  });
});