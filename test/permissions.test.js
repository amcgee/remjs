var scaffold = require('./test_scaffold');
var _ = require('lodash');

var resources = {
  'things': {},
  'users': {
    permissions: {
      anonymous: ['create','read','update','delete'] // anyone can do user things.  SUPER INSECURE!
    }
  }
};

var options = {
  authentication: {
    anonymous_signup: true,
    login_authority: {
      resource: 'users'
    }
  },
  permissions: {
    defaults: {
      'create': function( identity ) {
        return identity.is_the_special === true;
      },
      'read': function( identity ) {
        if ( identity.is_the_special )
          return true;
        else
          return {
            $and: [
              { owner: { $exists: true } },
              { owner: identity.organization }
            ]
          };
      },
      'update': 'mutable',
      'delete': false // only anonymous users can delete
    },
    anonymous: ['delete'] // anonymous users can delete things only
  }
};

scaffold.deploy('REM granular permissions:', resources, options, function(scaffolding, agent){
  var users = [
    { username: 'Rando', password: 'IAMAP4SSW0RD!', data: {} },
    { username: 'special', password: 'IAMAP4SSW0RD!', data: {
        is_the_special: true
      } },
    { username: 'Rando2', password: 'IAMAP4SSW0RD!', data: {
        organization: 'LutherCorp'
      }}
  ];
  var randomUser = users[0];
  var specialUser = users[1];
  var lutherCorpUser = users[2];
  var things = [
    { name: 'testThing', owner: 'LutherCorp' },
    { name: 'otherThing', mutable: true }
  ];

  before(function(done) {
    var userCount = 0;
    _.forEach( users, function(user) {
      agent
        .post('/_signup')
        .send({
          login: user.username,
          password: user.password
        })
        .end(function(e,res) {
          user._id = res.body[0]._id;
          ++userCount;
          if ( userCount == users.length )
            done();
        }.bind(this));
    });
  });

  before(function(done) {
    var userCount = 0;
    _.forEach( users, function(user) {
      if ( !user.data || _.keys(user.data).length === 0 )
      {
        ++userCount;
        return;
      }
      agent
        .patch('/users/'+user._id)
        .send(user.data)
        .end(function() {
          ++userCount;
          if ( userCount == users.length )
            done();
        });
    });
  });

  before(function(done) {
    var userCount = 0;
    _.forEach( users, function(user) {
      agent
        .post('/_login')
        .send({
          login: user.username,
          password: user.password
        })
        .end(function(e,res) {
          user.token = res.text;
          ++userCount;
          if ( userCount == users.length )
            done();
        }.bind(this));
    });
  });

  before(function(done) {
    var thingCount = 0;
    _.forEach( things, function(thing) {
      agent
        .post('/things')
        .set('Authorization', 'Bearer ' + specialUser.token)
        .send(thing)
        .end(function(e,res) {
          thing._id = res.body._id;
          ++thingCount;
          if ( thingCount == things.length )
            done();
        });
    });
  });

  it('Try to get the things list (unauthenticated, should fail)', function(done){
    agent
      .get('/things' )
      .expect(401)
      .expect('www-authenticate', 'Bearer')
      .end(done);
  });

  it('Try to create a thing as a non-special user (insufficient permissions, should fail)', function(done){
    agent
      .post('/things' )
      .set('Authorization', 'Bearer ' + randomUser.token)
      .send({ name: 'dummy' })
      .expect(403)
      .end(done);
  });
  it('Try to create a thing as another non-special user (insufficient permissions, should fail)', function(done){
    agent
      .post('/things' )
      .set('Authorization', 'Bearer ' + lutherCorpUser.token)
      .send({ name: 'dummy' })
      .expect(403)
      .end(done);
  });
  it('Try to create a thing as a special user (sufficient permissions, should succeed)', function(done){
    agent
      .post('/things' )
      .set('Authorization', 'Bearer ' + specialUser.token)
      .send({ name: 'dummy' })
      .expect(201)
      .end(function(e, res) {
        if (e) return done(e);
        things.push( res.body );
        done();
      });
  });

  it('Get the list of things as the random user (should be empty)', function(done){
    agent
      .get('/things' )
      .set('Authorization', 'Bearer ' + randomUser.token)
      .expect(200)
      .expect(function(res) {
        res.body.should.be.a('array');
        res.body.length.should.eql(0);
      })
      .end(done);
  });

  it('Get the list of things as the LutherCorp user (should be just the LutherCorp thing)', function(done){
    agent
      .get('/things' )
      .set('Authorization', 'Bearer ' + lutherCorpUser.token)
      .expect(200)
      .expect(function(res) {
        res.body.should.be.a('array');
        res.body.length.should.eql(1);
      })
      .end(done);
  });
  it('Get the list of things as the special user (should be all the things)', function(done){
    agent
      .get('/things' )
      .set('Authorization', 'Bearer ' + specialUser.token)
      .expect(200)
      .expect(function(res) {
        res.body.should.be.a('array');
        res.body.length.should.eql(things.length);
      })
      .end(done);
  });

  it('Try to modify an immutable thing (any authenticated user, should fails)', function(done){
    agent
      .post('/things/' + things[0]._id )
      .set('Authorization', 'Bearer ' + specialUser.token)
      .send({
        something: true
      })
      .expect(404) // THIS SHOULD BE 403?
      .end(done);
  });

  it('Try to modify an mutable thing (any authenticated user, should succeed)', function(done){
    agent
      .post('/things/' + things[1]._id )
      .set('Authorization', 'Bearer ' + specialUser.token)
      .send({
        something: true
      })
      .expect(200)
      .end(done);
  });
  it('Make sure it was actually modified', function(done){
    agent
      .get('/things/' + things[1]._id )
      .set('Authorization', 'Bearer ' + specialUser.token)
      .expect(200)
      .expect(function(res) {
        res.body.should.be.an('object');
        res.body.should.have.property('something');
        res.body.should.not.have.property('mutable');
      })
      .end(done);
  });
  it('Try to modify the now-immutable thing again (any authenticated user, should fail)', function(done){
    agent
      .post('/things/' + things[1]._id )
      .set('Authorization', 'Bearer ' + specialUser.token)
      .send({
        something: true
      })
      .expect(404) // THIS SHOULD BE 403?
      .end(done);
  });

  it('Try to delete a thing (any authenticated user, should fail)', function(done){
    agent
      .del('/things/' + things[2]._id )
      .set('Authorization', 'Bearer ' + specialUser.token)
      .expect(403)
      .end(done);
  });

  it('Try to delete a thing (anonymous, should succeed)', function(done){
    agent
      .del('/things/' + things[2]._id )
      .expect(200)
      .end(done);
  });
});
