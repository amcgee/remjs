var scaffold = require('./test_scaffold');

var resources = {
  'employees': {},
  'departments': {
    children: ['employees']
  },
  'users': {}
};

var options = {
  authentication: {
    anonymous_signup: true,
    signup_path: '/_signup',
    login_path: '/_login',
    //me_path: '/me',
    login_authority: {
      resource: 'users'
    }
  }
};

scaffold.deploy('REM authentication:', resources, options, function(scaffolding, agent) {
  var user_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6eyJ1c2VybmFtZSI6IlRlc3RVc2VyIiwiX2lkIjoiVDVteUxKZG9jM2VTczYwVCJ9LCJpYXQiOjE0MTY4NjYwMDUuMTAxLCJleHAiOjE0MTY4Njc4MDUuMTAxfQ.JecmGi0H0do2IZCAa0iZfYT1G-xIz8U6w3Sb6ZWSG5A';
  var username = 'TestUser';
  var password = 'IAMAP4SSW0RD!';
  var password2 = null;
  var password3 = 'testingchange';

  it('Try to get the departments list (unauthenticated, should fail)', function(done){
    agent
      .get('/departments' )
      .expect('www-authenticate', 'Bearer')
      .expect(401, done);
  });

  it('Try to get the departments list with a bogus token (unauthenticated, should fail)', function(done){
    agent
      .get('/departments' )
      .set('Authorization', 'Bearer ' + user_token)
      .expect('www-authenticate', 'Bearer')
      .expect(401, done);
  });
	
  it('Create a new user', function(done){
  	agent
      .post('/_signup')
      .send( {
        login: username,
        password: password
      })
  		.expect(201)
      .expect(function(res){
        res.body.should.be.an('object');
      })
      .end(done);
  });

  it('Attempt to create a user with no username (should fail)', function(done) {
    agent
      .post('/_signup')
      .send( {
        password: password
      })
      .expect(400, done); // Should be 403
  });

  it('Attempt to create a user with no password (should fail)', function(done) {
    agent
      .post('/_signup')
      .send( {
        username: username
      })
      .expect(400, done); // Should be 403
  });

  it('Attempt to hack the system with no username (should fail)', function(done) {
    agent
      .post('/_login')
      .send( {
        password: password
      })
      .expect(400, done); // Should be 403
  });

  it('Attempt to hack the system with no password (should fail)', function(done) {
    agent
      .post('/_login')
      .send( {
        username: username
      })
      .expect(400, done); // Should be 403
  });

  it('Fail to create another user with the same name', function(done){
    agent
      .post('/_signup')
      .send( {
        login: username,
        password: password
      })
      .expect(400, done);
  });

  it('Attempt to hack the system with a bad username (should fail)', function(done) {
    agent
      .post('/_login')
      .send( {
        login: 'Hal',
        password: password
      })
      .expect(400, done); // Should be 403
  });

  it('Attempt to hack the system with a bad password (should fail)', function(done) {
    agent
      .post('/_login')
      .send( {
        login: username,
        password: 'NOT'+password
      })
      .expect(400, done); // Should be 403
  });

  it('Log in as the new user', function(done){
    agent
      .post('/_login')
      .send( {
        login: username,
        password: password
      })
      .expect(200)
      .expect(function(res) {
        res.text.should.be.a('string');
        res.text.length.should.not.eql(0);
        user_token = res.text;
      })
      .end(done);
  });

  it('Get the department list (authenticated, should succeed)', function(done){
    agent
      .get('/departments' )
      .set('Authorization', 'Bearer ' + user_token)
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(0);
      })
      .end(done);
  });

  it('Get the /me data for the users', function(done) {
    agent
      .get('/me' )
      .set('Authorization', 'Bearer ' + user_token)
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('object');
        res.body.should.not.be.an('array');
        res.body.username.should.eql(username);
        res.body.should.not.have.property('password');
      })
      .end(done);
  });

  it('Attempt to change my password without specifying the old one (to random, should fail)', function(done) {
    agent
      .del('/me/_password' )
      .set('Authorization', 'Bearer ' + user_token)
      .send({})
      .expect(400, done);
  });

  it('Attempt to change my password but specifying a bad old one (to random, should fail)', function(done) {
    agent
      .del('/me/_password' )
      .set('Authorization', 'Bearer ' + user_token)
      .send( {
        password:password+'!'
      })
      .expect(400, done);
  });

  it('Change my password (to random)', function(done) {
    agent
      .del('/me/_password' )
      .set('Authorization', 'Bearer ' + user_token)
      .send( {
        old_password: password
      })
      .expect(200)
      .expect(function(res) {
        res.text.should.be.an('string');
        res.text.length.should.not.eql(0);
        password2 = res.text;
      })
      .end(done);
  });
  it('Check that the current "session" is still valid', function(done) {
    agent
      .get('/departments' )
      .set('Authorization', 'Bearer ' + user_token)
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(0);
      })
      .end(done);
  });
  it('Make sure the old password no longer works', function(done) {
    agent
      .post('/_login')
      .send( {
        login: username,
        password: password
      })
      .expect(400, done);
  });

  it('Log in with the new password', function(done) {
    agent
      .post('/_login')
      .send( {
        login: username,
        password: password2
      })
      .expect(200)
      .expect(function(res) {
        res.text.should.be.a('string');
        res.text.length.should.not.eql(0);
        user_token = res.text;
      })
      .end(done);
  });

  it('Make sure the new password login session worked', function(done) {
    agent
      .get('/departments' )
      .set('Authorization', 'Bearer ' + user_token)
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(0);
      })
      .end(done);
  });

  it('Try to change my password (as an unauthenticated user)', function(done) {
    agent
      .post('/me/_password' )
      .send( {
        old_password: password2,
        new_password: 'testingchange'
      })
      .expect(401, done);
  });

  it('Try to reset my password (as an unauthenticated user)', function(done) {
    agent
      .del('/me/_password' )
      .send( {
        old_password: password2,
        new_password: 'testingchange'
      })
      .expect(401, done);
  });

  it('Attempt to change my password without specifying the old one (to something explicit, should fail)', function(done) {
    agent
      .post('/me/_password' )
      .set('Authorization', 'Bearer ' + user_token)
      .send( {
        new_password:'HAXOR'
      })
      .expect(400, done);
  });

  it('Attempt to change my password but specifying a bad old one (to something explicit, should fail)', function(done) {
    agent
      .post('/me/_password' )
      .set('Authorization', 'Bearer ' + user_token)
      .send( {
        old_password:password+'!',
        new_password:'HAXOR'
      })
      .expect(400, done);
  });
  it('Change my password (to something explicit)', function(done) {
    agent
      .post('/me/_password' )
      .set('Authorization', 'Bearer ' + user_token)
      .send( {
        old_password: password2,
        new_password: 'testingchange'
      })
      .expect(200)
      .expect(function(res)
      {
        res.text.should.be.an('string');
        res.text.length.should.not.eql(0);
      })
      .end(done);
  });
  it('Check that the current "session" is still valid', function(done) {
    agent
      .get('/departments' )
      .set('Authorization', 'Bearer ' + user_token)
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(0);
      })
      .end(done);
  });
  it('Make sure the old password no longer works', function(done) {
    agent
      .post('/_login')
      .send( {
        login: username,
        password: password2
      } )
      .expect(400, done);
  });

  it('Log in with the new password', function(done) {
    agent
      .post('/_login')
      .send( {
        login: username,
        password: password3
      })
      .expect(200)
      .expect(function(res) {
        res.text.should.be.a('string');
        res.text.length.should.not.eql(0);
        user_token = res.text;
      })
      .end(done);
  });

  it('Make sure the new password login session worked', function(done) {
    agent
      .get('/departments' )
      .set('Authorization', 'Bearer ' + user_token)
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('array');
        res.body.length.should.eql(0);
      })
      .end(done);
  });
});