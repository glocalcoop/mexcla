var should = require('should');
var request = require('superagent');
var mongojs = require('mongojs');
var db = mongojs('localhost:27018/mexcladb_test', ['rooms']);

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

  describe('moderator', function(){
    it('should change the moderator', function(done){
         request
            .get(url + '/room/id/' + roomId)
            .end(function(err, res){
              res.body.moderator.should.eql(userId);
              request
                .post(url + '/room/id/' + roomId + '/moderator')
                .set('cookie', 'id=' + userId)
                .send({moderator: newUserId})
                .end(function(err, res){
                  res.body.moderator.should.eql(newUserId);
                  done();
                });
            });
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

  var channelid;
  describe('update room with new channel', function(){
    it('should add new Spanish channel', function(done){
      request
        .post(url + '/room/id/' + roomId + '/channel/create')
        .send({lang: 'es'})
        .set('cookie', 'id=' + userId)
        .end(function(err,res){
          res.body.roomnum.should.eql(roomNumber);
          res.body.users.length.should.eql(1);
          res.body.channels.length.should.eql(1);
          res.body.channels[0].lang.should.eql('es');
          res.body.channels[0]._id.should.have.length(24);
          channelid = res.body.channels[0]._id;
          done();
        });
    });
  });

  describe('update channel', function() {
    
    it('should add new interpreter', function(done){
      request
        .post(url + '/room/id/' + roomId + '/channel/' + channelid + '/update')
        .send({interpreter: 'pointsman'})
        .set('cookie', 'id=' + userId)
        .end(function(err, res){
          res.body.interpreter.should.eql('pointsman');
          res.body._id.should.eql(channelid);
          done();
        });
    });

    it('should change the interpreter and the language', function(done){
      request
        .post(url + '/room/id/' + roomId + '/channel/' + channelid + '/update')
        .send({interpreter: 'der springer', lang: 'gr'})
        .set('cookie', 'id=' + userId)
        .end(function(err, res){
          res.body.interpreter.should.eql('der springer');
          res.body._id.should.eql(channelid);
          done();
        });
    });
  });

  describe('hand raising', function(){

    describe('rise hand', function(){
      it('server should receive request for hand raise', function(done){
        request
          .post(url + '/room/id/' + roomId + '/raisehand')
          .set('cookie', 'id=' + userId)
          .end(function(err,res){
            res.body.handsQueue.length.should.eql(1);
            res.body.handsQueue[0].username.should.eql('FAKE SPANISH USER');
            done();
          });
      });

      it('database should have hand raise', function(done){
        db.rooms.findOne({ _id: mongojs.ObjectId(roomId)}, function(err, room){
          room.handsQueue[0].lang.should.eql('es');
          room.handsQueue[0].username.should.eql('FAKE SPANISH USER');
          room.handsQueue.length.should.eql(1);
          done();
        });
      });
    });

    describe('call on', function(){
      it('server should receive call-on request', function(){
        false.should.be.true();

      });

      it('database should remove hand raisee from queue and place in called-on position', function() {
        false.should.be.true();

      });

    });
  });

});

