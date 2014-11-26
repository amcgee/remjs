var superagent = require('superagent')
var expect = require('expect.js')
var _ = require('lodash')
var scaffold = require('./test_scaffold');

describe('REM granular permissions functionality:', function(){
	var scaffolding = scaffold.create({
    'things': {},
    'users': {
      permissions: {
        annonymous: ['create','read','update','delete'] // anyone can do user things.  SUPER INSECURE!
      }
    }
  }, {
    authentication: {
      annonymous_signup: true,
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
              owner: identity.organization
            }
        },
        'update': {
          mutable: true
        },
        'delete': false // only annonymous users can delete
      },
      annonymous: ['delete'] // annonymous users can delete things only
    }
  });

  after(function() {
    scaffolding.destroy();
  })

  var url = scaffolding.baseURL();
  console.log( "Base URL: %s", url );

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
  ]

  before(function(done) {
    var userCount = 0;
    _.forEach( users, function(user) {
      superagent.post(url+'/_signup')
        .send({
          login: user.username,
          password: user.password
        }).end(function(e,res) {
          user._id = res.body._id;
          ++userCount
          if ( userCount == users.length )
            done();
        }.bind(this))
    })
  })

  before(function(done) {
    var userCount = 0;
    _.forEach( users, function(user) {
      superagent.patch(url+'/users/'+user._id)
        .send(user.data).end(function(e,res) {
          ++userCount
          if ( userCount == users.length )
            done();
        })
    })
  })

  before(function(done) {
    var userCount = 0;
    _.forEach( users, function(user) {
      superagent.post(url+'/_login')
        .send({
          login: user.username,
          password: user.password
        }).end(function(e,res) {
          user.token = res.text;
          ++userCount
          if ( userCount == users.length )
            done();
        }.bind(this))
    })
  })

  before(function(done) {
    var thingCount = 0;
    _.forEach( things, function(thing) {
      superagent.post(url+'/things')
        .set('Authorization', 'Bearer ' + specialUser.token)
        .send(thing).end(function(e,res) {
          thing._id = res.body._id
          ++thingCount
          if ( thingCount == things.length )
            done();
        })
    })
  })

  it('Try to get the things list (unauthenticated, should fail)', function(done){
    superagent.get(url + '/things' )
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(401);
      expect(res.headers['www-authenticate']).to.eql('Bearer');
      done();
    });
  })

  it('Try to create a thing as a non-special user (insufficient permissions, should fail)', function(done){
    superagent.post(url + '/things' )
    .set('Authorization', 'Bearer ' + randomUser.token)
    .send({ name: 'dummy' })
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(403);
      done();
    });
  })
  it('Try to create a thing as another non-special user (insufficient permissions, should fail)', function(done){
    superagent.post(url + '/things' )
    .set('Authorization', 'Bearer ' + lutherCorpUser.token)
    .send({ name: 'dummy' })
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(403);
      done();
    });
  })
  it('Try to create a thing as a special user (sufficient permissions, should succeed)', function(done){
    superagent.post(url + '/things' )
    .set('Authorization', 'Bearer ' + specialUser.token)
    .send({ name: 'dummy' })
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(201);
      things.push( res.body );
      done();
    });
  })

  it('Get the list of things as the random user (should be empty)', function(done){
    superagent.get(url + '/things' )
    .set('Authorization', 'Bearer ' + randomUser.token)
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.a('object');
      expect(res.body).to.be.a('array');
      expect(res.body.length).to.eql(0);
      done();
    });
  })

  it('Get the list of things as the LutherCorp user (should be just the LutherCorp thing)', function(done){
    superagent.get(url + '/things' )
    .set('Authorization', 'Bearer ' + lutherCorpUser.token)
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.a('object');
      expect(res.body).to.be.a('array');
      expect(res.body.length).to.eql(1);
      done();
    });
  })
  it('Get the list of things as the special user (should be all the things)', function(done){
    superagent.get(url + '/things' )
    .set('Authorization', 'Bearer ' + specialUser.token)
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.a('object');
      expect(res.body).to.be.a('array');
      expect(res.body.length).to.eql(things.length);
      done();
    });
  })

  it('Try to modify an immutable thing (any authenticated user, should fails)', function(done){
    superagent.post(url + '/things/' + things[0]._id )
    .set('Authorization', 'Bearer ' + specialUser.token)
    .send({
      something: true
    })
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(404); // THIS SHOULD BE 403?
      done();
    });
  })

  it('Try to modify an mutable thing (any authenticated user, should succeed)', function(done){
    superagent.post(url + '/things/' + things[1]._id )
    .set('Authorization', 'Bearer ' + specialUser.token)
    .send({
      something: true
    })
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      done();
    });
  })
  it('Make sure it was actually modified', function(done){
    superagent.get(url + '/things/' + things[1]._id )
    .set('Authorization', 'Bearer ' + specialUser.token)
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('something');
      expect(res.body).not.to.have.property('mutable');
      done();
    });
  })
  it('Try to modify the now-immutable thing again (any authenticated user, should fail)', function(done){
    superagent.post(url + '/things/' + things[1]._id )
    .set('Authorization', 'Bearer ' + specialUser.token)
    .send({
      something: true
    })
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(404); // THIS SHOULD BE 403?
      done();
    });
  })

  it('Try to delete a thing (any authenticated user, should fail)', function(done){
    superagent.del(url + '/things/' + things[2]._id )
    .set('Authorization', 'Bearer ' + specialUser.token)
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(403);
      done();
    });
  })
  it('Try to a thing (annonymous, should succeed)', function(done){
    superagent.del(url + '/things/' + things[2]._id )
    .end(function(e,res){
      expect(e).to.eql(null);
      expect(res.status).to.eql(200);
      done();
    });
  })

})