var scaffold = require('./test_scaffold');
var _ = require('lodash');

var resources = {
    'employees': {},
    'departments': {
        children: ['employees']
    }
};
var options = {};

scaffold.deploy('REM rest api basic functionality (no schema validation):', resources, options, function(scaffolding, agent) {
    it('get the version', function(done){
        agent
            .get('/_version')
            .expect(200)
            .expect(function(res) {
                res.text.should.be.a('string');
                res.text.should.eql(scaffolding.options.version);
            })
            .end(done);
    });

    it('get the help text', function(done){
        agent
            .get('/_help')
            .expect(200)
            .expect(function(res) {
                res.body.should.be.an('array');
                res.body.should.eql(_.keys(scaffolding.options.resources));
            })
            .end(done);
    });

    it('fetch an empty collection', function(done){
        agent
                .get('/departments')
        .expect(200)
            .expect(function(res) {
                res.body.should.be.an('array');
                res.body.length.should.eql(0);
            })
                    .end(done);
    });

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
                res.body.should.be.an('object');
                res.body.should.not.be.an('array');
                departmentID = res.body._id;
            })
            .end(done);
    });
    it('fetch new department', function(done){
        agent
            .get('/departments/' + departmentID)
            .expect(200)
            .expect(function(res) {
                res.body.should.be.an('object');
                res.body.should.not.be.an('array');
                res.body._id.should.eql(departmentID);
                res.body.name.should.eql(departmentName);
                res.body.purpose.should.eql(departmentPurpose);
            })
            .end(done);
    });

    it('fail to overwrite a non-existent department', function(done) {
        agent
            .post('/departments/abcdefghijk')
            .expect(404)
            .end(done);
    });

    it('fail to patch a non-existent department', function(done) {
        agent
            .patch('/departments/abcdefghijk')
            .expect(404)
            .end(done);
    });

    it('fail to delete a non-existent department', function(done) {
        agent
            .del('/departments/abcdefghijk')
            .expect(404)
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
                res.body.should.be.an('object');
                res.body.should.not.be.an('array');
            })
            .end(done);
    });

    it('get the empty "TPSReportDepartment" employees list', function(done) {
        agent
            .get('/departments/' + departmentID + '/employees')
            .expect(200)
            .expect(function(res) {
                res.body.should.be.an('array');
                res.body.length.should.eql(0);
            })
            .end(done);
    });
    var employees = [];
    _.forEach( ['George Washington','Abraham Lincoln','Johnny Appleseed'], function(dummy_name) {
        it('add an employee', function(done){
            agent
                .post('/departments/' + departmentID + '/employees')
                .send({
                    name: dummy_name
                })
                .expect(201)
                .expect(function(res) {
                    res.body.should.be.an('object');
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
                _.forEach( res.body, function( employee ) {
                    ticklist = _.without( ticklist, employee._id );
                } );
                ticklist.length.should.eql(0);
            })
            .end(done);
    });

    it('try getting an employee individually', function(done) {
        agent
            .get('/departments/' + departmentID + '/employees/' + employees[0])
            .expect(200)
            .expect(function(res) {
                res.body.should.be.an('object');
                res.body.should.not.be.an('array');
                res.body._id.should.eql(employees[0]);
                res.body.departments_id.should.eql(departmentID);
            })
            .end(done);
    });

    it('try to create an employee and overwrite departments_id (should fail)', function(done) {
        agent
            .post('/departments/' + departmentID + '/employees')
            .send({
                name: 'BOGUS',
                departments_id: 'HAXORS'
            })
            .expect(400)
            .end(done);
    });

    it('update an employee but try to override the immutable department id (patch)', function(done) {
        agent
            .patch('/departments/' + departmentID + '/employees/' + employees[0])
            .send({
                departments_id: 'HAXORS'
            })
            .expect(400)
            .end(done);
    });

    it('update an employee but try to override the immutable department id (post)', function(done) {
        agent
            .post('/departments/' + departmentID + '/employees/' + employees[0])
            .send({
                departments_id: 'HAXORS'
            })
            .expect(400)
            .end(done);
    });

    it('update an employee but with an OK override (patch)', function(done) {
        agent
            .post('/departments/' + departmentID + '/employees/' + employees[0])
            .send({
                name: 'Appleseed'
            })
            .expect(200)
            .end(done);
    });

    it('update an employee but actually override the whole thing (post)', function(done) {
        agent
            .post('/employees/' + employees[0])
            .send({
                departments_id: departmentID,
                name: 'Fruitsprout'
            })
            .expect(200)
            .end(done);
    });

    it('delete the employees', function(done) {
        _.forEach( employees, function( employee_id ) {
            agent
                .del('/departments/' + departmentID + '/employees/'+ employee_id)
                .expect(200)
                .end(function() {
                    employees = _.without( employees, employee_id );
                    if ( employees.length === 0 )
                        done();
                });
        });
    });
    it('get the empty employees list again', function(done) {
        agent
            .get('/departments/' + departmentID + '/employees')
            .expect(200)
            .expect(function(res) {
                res.body.should.be.an('array');
                res.body.length.should.eql(0);
            })
            .end(done);
    });

    it('delete the department', function(done){
        agent
            .del('/departments/' + departmentID)
            .expect(200)
            .end(done);
    });

    it('fetch the non-existent deleted department (should fail)', function(done){
        agent
            .get('/departments/' + departmentID)
            .expect(404)
            .end(done);
    });
});
