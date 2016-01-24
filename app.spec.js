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

// describe('homepage', function(){
//   it('should return "none"" when there are no cookies', function(done){
//     request.get(url).end(function(err, res){
//       should.not.exist(err);
//       res.body.user.should.eql('none');
//       res.body.salutation.should.eql('Hi');
//       done();
//     });
//   });
  
//   it('should return user information and correct lang when cookie is sent', function(done){
//     request.get(url)
//       .set('cookie', 'id=' + userId)
//       .end(function(err, res){
//         res.body.user._id.should.eql(userId);
//         res.body.salutation.should.eql('Hola');
//         done();
//      });
//   });
// });
  
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

describe('rooms', function(){
  var roomNumber;
  var roomId;
  it('should create a new room and return with room info', function(done){
   request
      .get(url + '/room/create')
      .set('cookie', 'id=' + userId)
      .end(function(err, res){
        should.not.exist(err);
        roomNumber = res.body.roomnum;
        roomId = res.body._id;
        res.body.users.length.should.eql(1);
        res.body.users[0].lang.should.eql('es');
        res.body.moderator.should.eql(userId);
        done();
      });
  });

  var newUserId;
  before(function(done){
    request
      .post(url + '/users/new')
      .send({username: 'FAKE ENGLISH USER', lang: 'en'})
      .end(function(err, res){
        if (err) {
          console.log(err);
        }
        newUserId = res.body._id;
        done();
      });
  });
  
  it('should add a new user to the room', function(done){
    request
      .get(url + '/room/' + roomNumber)
      .set('cookie', 'id=' + newUserId)
      .end(function(err, res){
        //should.not.exist(err);
        res.body.roomnum.should.eql(roomNumber);
        res.body.users.length.should.eql(2);
        res.body.users[0].lang.should.eql('es');
        res.body.users[1].lang.should.eql('en');
        res.body.moderator.should.eql(userId);
        done();
    });
  });

  
  it('should provide room info if user is already in room', function(done){
    request
      .get(url + '/room/' + roomNumber)
      .set('cookie', 'id=' + userId)
      .end(function(err, res){
        //should.not.exist(err);
        res.body.roomnum.should.eql(roomNumber);
        res.body.users.length.should.eql(2);
        res.body.users[0].lang.should.eql('es');
        res.body.users[1].lang.should.eql('en');
        done();
      });
  });

  it('should retrieve info by id', function(done){
    request
      .get(url + '/room/' + roomNumber)
      .set('cookie', 'id=' + userId)
      .end(function(err, res){
        //should.not.exist(err);
        var roomID = res.body._id;
        request.get(url + '/room/id/' + roomID)
          .end(function(err, res){
            res.body.roomnum.should.eql(roomNumber);
            res.body.users.length.should.eql(2);
            res.body.users[0].lang.should.eql('es');
            res.body.users[1].lang.should.eql('en');
            res.body.moderator.should.eql(userId);
            done();
          });
      });
  });
  
  describe('is room available', function(done){
    var isRoomNumAvailable = require('./app').isRoomNumAvailable;
    
    it('' + roomNumber + ' should not be available', function(done){
      isRoomNumAvailable(roomNumber, function(answer){
        roomNumber.should.be.type('number');
        answer.should.eql(false);
        done();
      });
    });

    it('some other room number should be available', function(done){
      var otherRoomNumber = (1000 === roomNumber) ? 1001 : 1000;
      isRoomNumAvailable(otherRoomNumber, function(answer){
          answer.should.eql(true);
          done();
      });
     });
  });

  describe('leaving rooms', function(){
    it('should remove FAKE SPANISH USER from room and return user info', function(done){
      request
        .get(url + '/room/' + roomNumber + '/leave')
        .set('cookie', 'id=' + userId)
        .end(function(err, res){
          res.body.salutation.should.eql('Hola');
          res.body.user._id.should.eql(userId);
          done();
        });
    });

    it('FAKE ENGLISH USER should now be the only person in the room (poor lonely fake english user)', function(done){
        request
          .get(url + '/room/' + roomNumber)
          .set('cookie', 'id=' + newUserId)
          .end(function(err, res){
            //should.not.exist(err);
            res.body.roomnum.should.eql(roomNumber);
            res.body.users.length.should.eql(1);
            res.body.users[0].lang.should.eql('en');
            done();
          });
      });
  });

  describe('update room with new channel', function(){
    it('should add new Spanish channel', function(done){
      request
        .post(url + '/room/id/' + roomId + '/createchannel')
        .send({lang: 'es'})
        .set('cookie', 'id=' + userId)
        .end(function(err,res){
          res.body.roomnum.should.eql(roomNumber);
          res.body.users.length.should.eql(1);
          res.body.channels.length.should.eql(1);
          res.body.channels[0].lang.should.eql('es');
          res.body.channels[0]._id.should.have.length(24);
          done();
        });
    });
  });
  
});
