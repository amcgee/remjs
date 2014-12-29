var superagent = require('superagent');
var expect = require('expect.js');
var _ = require('lodash');
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
    annonymous_signup: true,
    signup_path: '/_signup',
    login_path: '/_login',
    //me_path: '/me',
    login_authority: {
      resource: 'users'
    }
  }
};
scaffold.deploy('REM authentication:', resources, options, function(scaffolding){
  var url = scaffolding.baseURL();

  var user_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6eyJ1c2VybmFtZSI6IlRlc3RVc2VyIiwiX2lkIjoiVDVteUxKZG9jM2VTczYwVCJ9LCJpYXQiOjE0MTY4NjYwMDUuMTAxLCJleHAiOjE0MTY4Njc4MDUuMTAxfQ.JecmGi0H0do2IZCAa0iZfYT1G-xIz8U6w3Sb6ZWSG5A';
  var username = 'TestUser';
  var password = 'IAMAP4SSW0RD!';
  var password2 = null;
  var password3 = 'testingchange';

  it('Try to get the departments list (unauthenticated, should fail)', function(done){
    superagent.get(url + '/departments' )
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(401);
      expect(res.headers['www-authenticate']).to.eql('Bearer');
      done();
    });
  });

  it('Try to get the departments list with a bogus token (unauthenticated, should fail)', function(done){
    superagent.get(url + '/departments' )
    .set('Authorization', 'Bearer ' + user_token)
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(401);
      expect(res.headers['www-authenticate']).to.eql('Bearer');
      done();
    });
  });
	
  it('Create a new user', function(done){
  	superagent.post(url + '/_signup')
      .send( {
        login: username,
        password: password
      })
  		.end(function(e,res){
  			expect(e).to.eql(null);
  			expect(res.status).to.eql(201);
        expect(res.body).to.be.an('object');
  			done();
  		});
  });

  it('Attempt to hack the system with a bad password (should fail)', function(done) {
    superagent.post(url + '/_login')
      .send( {
        login: username,
        password: 'NOT'+password
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(400); // Should be 403
        done();
      });
  });

  it('Log in as the new user', function(done){
    superagent.post(url + '/_login')
      .send( {
        login: username,
        password: password
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.text).to.be.a('string');
        expect(res.text.length).not.to.eql(0);
        user_token = res.text;
        done();
      });
  });

  it('Get the department list (authenticated, should succeed)', function(done){
    superagent.get(url + '/departments' )
    .set('Authorization', 'Bearer ' + user_token)
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.eql(0);
      done();
    });
  });

  it('Get the /me data for the users', function(done) {
    superagent.get(url + '/me' )
    .set('Authorization', 'Bearer ' + user_token)
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body).not.to.be.an('array');
      expect(res.body.username).to.eql(username);
      expect(res.body.password).to.be(undefined);
      done();
    });
  });
  it('Change my password (to random)', function(done) {
    superagent.del(url + '/me/_password' )
    .set('Authorization', 'Bearer ' + user_token)
    .send( {
      old_password: password
    })
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      // console.log(res.body);
      expect(res.text).to.be.an('string');
      expect(res.text.length).not.to.eql(0);
      password2 = res.text;
      done();
    });
  });
  it('Check that the current "session" is still valid', function(done) {
    superagent.get(url + '/departments' )
    .set('Authorization', 'Bearer ' + user_token)
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.eql(0);
      done();
    });
  });
  it('Make sure the old password no longer works', function(done) {
    superagent.post(url + '/_login')
      .send( {
        login: username,
        password: password
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(400);
        done();
      });
  });

  it('Log in with the new password', function(done) {
    superagent.post(url + '/_login')
      .send( {
        login: username,
        password: password2
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.text).to.be.a('string');
        expect(res.text.length).not.to.eql(0);
        user_token = res.text;
        done();
      });
  });

  it('Make sure the new password login session worked', function(done) {
    superagent.get(url + '/departments' )
    .set('Authorization', 'Bearer ' + user_token)
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.eql(0);
      done();
    });
  });

  it('Try to change my password (as an unauthenticated user)', function(done) {
    superagent.post(url + '/me/_password' )
    .send( {
      old_password: password2,
      new_password: 'testingchange'
    })
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(401);
      done();
    });
  });

  it('Try to reset my password (as an unauthenticated user)', function(done) {
    superagent.del(url + '/me/_password' )
    .send( {
      old_password: password2,
      new_password: 'testingchange'
    })
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(401);
      done();
    });
  });

  it('Change my password (to something explicit)', function(done) {
    superagent.post(url + '/me/_password' )
    .set('Authorization', 'Bearer ' + user_token)
    .send( {
      old_password: password2,
      new_password: 'testingchange'
    })
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      expect(res.text).to.be.an('string');
      expect(res.text.length).not.to.eql(0);
      done();
    });
  });
  it('Check that the current "session" is still valid', function(done) {
    superagent.get(url + '/departments' )
    .set('Authorization', 'Bearer ' + user_token)
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.eql(0);
      done();
    });
  });
  it('Make sure the old password no longer works', function(done) {
    superagent.post(url + '/_login')
      .send( {
        login: username,
        password: password2
      } )
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(400);
        done();
      });
  });

  it('Log in with the new password', function(done) {
    superagent.post(url + '/_login')
      .send( {
        login: username,
        password: password3
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.text).to.be.a('string');
        expect(res.text.length).not.to.eql(0);
        user_token = res.text;
        done();
      });
  });

  it('Make sure the new password login session worked', function(done) {
    superagent.get(url + '/departments' )
    .set('Authorization', 'Bearer ' + user_token)
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.eql(0);
      done();
    });
  });
});