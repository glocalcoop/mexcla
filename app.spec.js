var should = require('should');
var request = require('superagent');

var url = 'localhost:8080';

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
















































