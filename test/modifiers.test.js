var scaffold = require('./test_scaffold');
var _ = require('lodash');


var resources = {
  'employees': {},
  'departments': {
    children: ['employees']
  }
};
var options = {};

scaffold.deploy('REM modifiers (fields, sort, limit, skip):', resources, options, function(scaffolding, agent){
  var departmentName = "TPSReportDepartment";
  var departmentPurpose = "NONE";

  var departmentID = null;

  it('create new department', function(done){
    agent
      .post('/departments')
      .send({
        name: departmentName,
        purpose: departmentPurpose
      })
      .expect(201)
      .expect(function(res) {
        res.body.should.not.be.an('array');
        departmentID = res.body._id;
      })
      .end(done);
  });

  it('create new employee (no department)', function(done){
    agent
      .post('/employees')
      .send({
        'name': "useless mcgee",
        'DOB': new Date()
      })
      .expect(201)
      .expect(function(res) {
        res.body.should.not.be.an('array');
      })
      .end(done);
  });

  var employees = [];
  _.forEach( ['President George Washington','President Abraham Lincoln','Dude Johnny Appleseed'], function(dummy_name) {
    it('add an employee', function(done){
      agent
        .post('/departments/' + departmentID + '/employees')
        .send({
          name: dummy_name
        })
        .expect(201)
        .expect(function(res) {
          res.body.should.not.be.an('array');
          res.body.name.should.eql(dummy_name);
          res.body.departments_id.should.eql(departmentID);
          employees.push(res.body._id);
        })
        .end(done);
    });
  });

  it('check that all the employees show up', function(done) {
    agent
      .get('/departments/' + departmentID + '/employees')
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(employees.length);
        var ticklist = _.clone(employees);
        _.forEach( res.body, function( employee, i ) {
          ticklist = _.without( ticklist, employee._id );
        } );
        ticklist.length.should.eql(0);
      })
      .end(done);
  });

  it('get all employees, sorted ascending by name', function(done) {
    agent
      .get('/departments/' + departmentID + '/employees?sort=name')
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(employees.length);

        var lastName = res.body[0].name;
        var i = 1;
        while ( i < res.body.length )
        {
          res.body[i].name.should.be.greaterThan(lastName);
          lastName = res.body[i].name;
          i += 1;
        }
      })
      .end(done);
  });

  it('get all employees, sorted descending by name', function(done) {
    agent
      .get('/departments/' + departmentID + '/employees?sort=-name')
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(employees.length);
        
        var lastName = res.body[0].name;
        var i = 1;
        while ( i < res.body.length )
        {
          res.body[i].name.should.be.lessThan(lastName);
          lastName = res.body[i].name;
          i += 1;
        }
      })
      .end(done);
  });

  var twoEmployees = null;
  it('try getting just 2 employees (using limit, sort)', function(done) {
    agent
      .get('/departments/' + departmentID + '/employees?sort=name&limit=2')
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(2);
        twoEmployees = res.body;
      })
      .end(done);
  });

  it('try getting the second 2 employees (using limit, sort, and skip)', function(done) {
    agent
      .get('/departments/' + departmentID + '/employees?sort=name&limit=2&skip=1')
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(2);

        res.body[0].name.should.eql(twoEmployees[1].name);
        res.body[1].name.should.not.eql(twoEmployees[0].name);
      })
      .end(done);
  });

  var commonName = "A John Smith";
  it('add two employees with the same name but different titles', function(done){
    // These start with A so they are the first two in the limit below.
    agent
      .post('/employees')
      .send({
        name: commonName,
        title: "Director"
      })
      .expect(201)
      .expect(function(res) {
        res.body.should.not.be.an('array');
        res.body.name.should.eql(commonName);
        res.body.title.should.eql("Director");
        employees.push(res.body._id);
      })
      .end(function(e, res) {
        if (e) return done(e);
        agent
          .post('/employees')
          .send({
            name: commonName,
            title: "Janitor"
          })
          .expect(201)
          .expect(function(res) {
            res.body.should.be.an('object');
            res.body.should.not.be.an('array');
            res.body.name.should.eql(commonName);
            res.body.title.should.eql("Janitor");
            employees.push(res.body._id);
          })
          .end(done);
      });
  });

  it('try getting those 2 employees (using multiple column sort)', function(done) {
    agent
      .get('/employees?limit=2&sort=name,title')
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(2);

        res.body[0].name.should.eql(commonName);
        res.body[1].name.should.eql(commonName);

        res.body[0].title.should.eql("Director");
        res.body[1].title.should.eql("Janitor");
      })
      .end(done);
  });

  it('try getting those 2 employees in reverse title order (again using multiple column sort)', function(done) {
    agent
      .get('/employees?limit=2&sort=name,-title')
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(2);

        res.body[0].name.should.eql(commonName);
        res.body[1].name.should.eql(commonName);

        res.body[0].title.should.eql("Janitor");
        res.body[1].title.should.eql("Director");
      })
      .end(done);
  });

  it('try getting all the employees, but only the "name" field (no _id, title or location)', function(done) {
    agent
      .get('/employees?fields=name')
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        
        _.forEach( res.body, function( employee ) {
           _.keys( employee ).length.should.eql(1);
           _.keys( employee )[0].should.eql("name");
        });
      })
      .end(done);
  });

  it('try getting all the employees, but only the "name" and "_id" fields (no location or title)', function(done) {
    agent
      .get('/employees?fields=name,_id')
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        
        _.forEach( res.body, function( employee ) {
           _.keys( employee ).length.should.eql(2);
           _.has(employee, "_id").should.eql(true);
           _.has(employee, "name").should.eql(true);
        });
      })
      .end(done);
  });
});