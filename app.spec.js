var should = require('should');
var request = require('superagent');
var mongojs = require('mongojs');
var db = mongojs('localhost:27018/mexcladb_test', ['rooms']);
var _ = require('underscore');

var url = 'localhost:8080';
var util = require('./util');

var userId;
describe('create new user', function(){
  it('should create a new user and return with user details', function(done){
    request
      .post(url + '/users/new')
      .send({username: 'FAKE SPANISH USER', lang: 'es'})
      .end(function(err, res){
        should.not.exist(err);
        res.body.username.should.eql('FAKE SPANISH USER');
        res.body._id.should.have.length(24);
        userId = res.body._id;
        done();
      });
  });
});

describe('Create Room Moderation Options', function(){

  it('should create a moderated room', function(done){
    request
      .get(url + '/room/create')
      .query({moderated: true})
      .set('cookie', 'id=' + userId)
      .end(function(err, res){
        res.body.isModerated.should.eql(true);
        done();
      });
  });

  it('should create a non-moderated room', function(done){
    request
      .get(url + '/room/create')
      .query({moderated: false})
      .set('cookie', 'id=' + userId)
      .end(function(err, res){
        res.body.isModerated.should.eql(false);
        done();
      });
  });

  
  it('should create a non-moderated room by default', function(done){
    request
      .get(url + '/room/create')
      .set('cookie', 'id=' + userId)
      .end(function(err, res){
        res.body.isModerated.should.eql(false);
        done();
      });
  });

});

describe('rooms', function(){
  var roomNumber;
  var roomId;
  var newUserId;

  // make new user for testing
  before(function(done){
    request
      .post(url + '/users/new')
      .send({username: 'FAKE ENGLISH USER', lang: 'en'})
      .end(function(err, res){
        if (err) {
          throw new Error (err);
        }
        newUserId = res.body._id;
        done();
      });
  });
  
  it('should create a new room and return with room info', function(done){
   request
      .get(url + '/room/create')
      .query({moderated: true})
      .set('cookie', 'id=' + userId)
      .end(function(err, res){
        should.not.exist(err);
        roomNumber = res.body.roomnum;
        roomId = res.body._id;
        res.body.users.length.should.eql(1);
        res.body.users[0].lang.should.eql('es');
        res.body.moderator.should.eql(userId);
        res.body.isModerated.should.eql(true);
        done();
      });
  });

  it('the room number should not be available', function(done){
    var mongoose = require('mongoose');
    mongoose.Promise = Promise;
    mongoose.connect('mongodb://127.0.0.1:27018/mexcladb_test');
    var roomModel =  require('./models/Room').Room;

    roomNumber.should.be.type('number');
    
    util.isRoomNumAvailable(roomModel, roomNumber, function(answer){
      answer.should.be.false();
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

  it('database should have the new user', function(done){
    db.rooms.findOne({ _id: mongojs.ObjectId(roomId)}, function(err, room){
      room.users.length.should.eql(2);
      room.users[0].lang.should.eql('es');
      room.users[1].lang.should.eql('en');
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
        request.get(url + '/room/id/' + roomId)
          .end(function(err, res){
            res.body.roomnum.should.eql(roomNumber);
            res.body.users.length.should.eql(2);
            res.body.users[0].lang.should.eql('es');
            res.body.users[1].lang.should.eql('en');
            done();
        });
   });
  
  
  describe('leaving rooms', function(){
    it('should remove FAKE SPANISH USER from room and return user info', function(done){
      request
        .get(url + '/room/' + roomNumber + '/leave')
        .set('cookie', 'id=' + userId)
        .end(function(err, res){
          res.body._id.should.eql(userId);
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

  describe('Add/remove Users from channel', function(){
    it('should add user to channel', function(done){
      request
        .post(url + '/room/id/' + roomId + '/channel/' + channelid + '/join')
        .send({_id: '123userid'})
        .end(function(err, res){
          res.body.channels.length.should.eql(1);
          res.body.channels[0].users.length.should.eql(1);
          res.body.channels[0].users[0].should.eql('123userid');
          done();
        });
    });

    it('should updated db', function(done){
      db.rooms.findOne({ _id: mongojs.ObjectId(roomId)}, function(err, room){
        room.channels.length.should.eql(1);
        room.channels[0].lang.should.eql('es');
        room.channels[0].users[0].should.eql('123userid');
        done();
      });
    });

    it('should remove user from channel', function(done){
      request
        .post(url + '/room/id/' + roomId + '/channel/' + channelid + '/leave')
        .send({_id: '123userid'})
        .end(function(err, res){
          res.body.channels.length.should.eql(1);
          res.body.channels[0].users.length.should.eql(0);
          done();
        });
    });

    it('should remove user from db', function(done){
      db.rooms.findOne({ _id: mongojs.ObjectId(roomId)}, function(err, room){
        room.channels.length.should.eql(1);
        room.channels[0].users.length.should.eql(0);
        done();
      });
    })
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

    // userId -> fake spanish user
    // newUserid -> fake english user
    // re-ad our user to the room;
    it('should add a new user to the room', function(done){
      request
        .get(url + '/room/' + roomNumber)
        .set('cookie', 'id=' + userId)
        .end(function(err, res){
          should.not.exist(err);
          res.body.roomnum.should.eql(roomNumber);
          res.body.users.length.should.eql(2);
          res.body.users[0].lang.should.eql('en');
          res.body.users[1].lang.should.eql('es');
          done();
        });
    });

    describe('raise hand', function(){
      it('server should receive request for hand raise', function(done){
        request
          .post(url + '/room/id/' + roomId + '/raisehand')
          .set('cookie', 'id=' + userId)
          .end(function(err,res){
            res.body.handsQueue.length.should.eql(1);
            res.body.handsQueue[0].username.should.eql('FAKE SPANISH USER');
            res.body.users.length.should.eql(2);
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

      it('two hands should be raised', function(done){
        request
          .post(url + '/room/id/' + roomId + '/raisehand')
          .set('cookie', 'id=' + newUserId)
          .end(function(err,res){
            res.body.handsQueue.length.should.eql(2);
            res.body.handsQueue[0].username.should.eql('FAKE SPANISH USER');
            res.body.handsQueue[1].username.should.eql('FAKE ENGLISH USER');
            res.body.users.length.should.eql(2);
            done();
          });
      });
      
    });

    describe('call on', function(){
      // right now anyone can send call on request
      // TODO: make sure only the moderator can call on people.
      // post data {_id: userId} of the person to call on
      it('server should receive call-on request', function(done){
         request
           .post(url + '/room/id/' + roomId + '/callon')
           .set('cookie', 'id=' + newUserId)
           .send({_id: userId}) // fake spanish user
          .end(function(err, res){
             res.body.handsQueue.length.should.eql(1);
             res.body.handsQueue[0].username.should.eql('FAKE ENGLISH USER');
             res.body.calledon.username.should.eql('FAKE SPANISH USER');
             res.body.calledon._id.should.eql(userId);
             done();
           });

      });

      it('database should remove hand raisee from queue and place in called-on position', function(done) {
        db.rooms.findOne({ _id: mongojs.ObjectId(roomId)}, function(err, room){
           room.handsQueue.length.should.eql(1);
           room.handsQueue[0].username.should.eql('FAKE ENGLISH USER');
           room.calledon.username.should.eql('FAKE SPANISH USER');
           done();
        });
      });
    });

    describe('call off', function(){

      it('should not change calledon if the user is not currently calledon', function(done){
        request
          .post(url + '/room/id/' + roomId + '/calloff')
          .send({_id: 12345})
          .end(function(err, res){
            res.body.calledon.username.should.eql('FAKE SPANISH USER');
            done();
          });
      });

      it('should be received by server', function(done){
        request
          .post(url + '/room/id/' + roomId + '/calloff')
          .send({_id: userId}) // fake spanish user
          .end(function(err, res){
            res.body.calledon.should.eql(false);
            done();
          });
      });

      it('should be removed from the db', function(done){
        db.rooms.findOne({ _id: mongojs.ObjectId(roomId)}, function(err, room){
          room.calledon.should.eql(false);
          done();
        });

      });

    });
    
    describe('lower hand', function(){
      it('should be received by server', function(done){
        request
          .post(url + '/room/id/' + roomId + '/lowerhand')
          .set('cookie', 'id=' + newUserId)
          .end(function(err,res){
            res.body.handsQueue.length.should.eql(0);
            done();
          });
      });
        
        it('should be removed in the database', function(done){
          db.rooms.findOne({ _id: mongojs.ObjectId(roomId)}, function(err, room){
            room.handsQueue.length.should.eql(0);
            done();
          });
        });
      });

    describe('mute', function(){

      it('request should be recieved by the server', function(done){
        request
          .post(url + '/room/id/' + roomId + '/mute')
          .send({_id: userId}) // fake spanish user
          .set('cookie', 'id=' + newUserId)
          .end(function(err, res){
            _.findWhere(res.body.users, {_id: userId}).isMuted.should.eql(true);
            done();
          });
      });

      it('should be set to true in the db', function(done){
          db.rooms.findOne({ _id: mongojs.ObjectId(roomId)}, function(err, room){
            room.users[1].isMuted.should.eql(true);
            done();
          });
        });
    });
  });

});


