var should = require('should');
var request = require('superagent');

var url = 'localhost:8080';

// make a spanish user for testing
var userId;
before(function(done){
  request
    .post(url + '/users/new')
    .send({username: 'FAKE SPANISH USER', lang: 'es'})
    .end(function(err, res){
      if (err) {
        console.log(err);
      }
      userId = res.body._id;
      done();
    });
});

describe('homepage', function(){
  it('should return "none" when there are no cookies', function(done){
    request.get(url).end(function(err, res){
      should.not.exist(err);
      res.body.user.should.eql('none');
      res.body.salutation.should.eql('Hi');
      done();
    });
  });
  
  it('should return user information and correct lang when cookie is sent', function(done){
    request.get(url)
      .set('cookie', 'id=' + userId)
      .end(function(err, res){
        res.body.user._id.should.eql(userId);
        res.body.salutation.should.eql('Hola');
        done();
     });
  });
});
  
describe('create new user', function(){
  it('should create a new user and return with user details', function(done){
    request
      .post(url + '/users/new')
      .send({username: 'Mr Buttons', lang: 'en'})
      .end(function(err, res){
        should.not.exist(err);
        res.body.username.should.eql('Mr Buttons');
        res.body._id.should.have.length(24);
        done();
     });
  });
});

describe('create new room', function(){
  it('should create a new room, put user in room, and return with room info', function(done){
    request
      .get(url + '/room/create')
      .set('cookie', 'id=' + userId)
      .end(function(err, res){
        should.not.exist(err);
        res.body.roomnum.should.eql(1234);
        res.body.users.length.should.eql(1);
        res.body.users[0].lang.should.eql('es');
        res.body.moderator.should.eql(userId);
        done();
      });
  });
});












































