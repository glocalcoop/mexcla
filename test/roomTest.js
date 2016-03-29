var THE_TESTING_ROOM = { 
  __v: 1,
  _id: '56b3c680b71df7e02b280be1',
  active: true,
  creator: '56b3c680b71df7e02b280bde',
  moderator: '56b3c680b71df7e02b280bde',
  roomnum: 4845,
  channels: [],
  users: 
  [ { lang: 'es',
      _id: '56b3c680b71df7e02b280bde',
      username: 'FAKE SPANISH USER',
      isMuted: true
    },
    
    { lang: 'en',
      _id: '56b3c680b71df7e02b280be0',
      username: 'FAKE ENGLISH USER',
      isMuted: false
    } ] 
};

var AliceAttr = {"lang":"en","__v":0,"username":"Alice","_id":"56faea72ef6b9d2e0726881e","isMuted":false,"admin":false,"currentRoom":null};

var MrButtonsAttr = {"__v":0,"username":"MrButtons","_id":"56faee7eef6b9d2e07268820","isMuted":true,"admin":false,"lang":"en","currentRoom":null};

var room6433Attr = {"__v":1,"roomnum":6433,"active":true,"creator":"56faea72ef6b9d2e0726881e","isModerated":false,"moderator":null,"_id":"56faea72ef6b9d2e0726881f","handsQueue":[],"channels":[],"users":[{"lang":"en","_id":"56faea72ef6b9d2e0726881e","username":"Alice","isMuted":false},{"lang":"en","_id":"56faee7eef6b9d2e07268820","username":"MrButtons","isMuted":true}]};

var mockCreateChannelAjax = function(info) {
  return {
    done: function(next) {
      var room = _.extend(THE_TESTING_ROOM, {channels:[{"lang":"es","_id":"56b3d01331301f243699d1d0","users":[]}]});
      next(room);
    }
  };
};

var stubAjax = function(returnMe) {
  return function(){
    return  {
      done: function(callback) {
        callback(returnMe);
      }
    };
  };
};


describe('Models.util', function(){
  describe('room.userByRoom', function(){
    it('should return userInfo given userid', function(){
      var user = Models.util.room.userById(THE_TESTING_ROOM.users, '56b3c680b71df7e02b280be0');
      user.username.should.eql('FAKE ENGLISH USER');
    });
  });
  describe('room.userById', function(){
    var room = new Models.Room(room6433Attr);
    it('returns user object', function(){
      var user = Models.util.room.userById(room.get('users'), AliceAttr._id);
      user.username.should.eql("Alice");
    });
    it('returns undefined if no user is found', function(){
      _.isUndefined(Models.util.room.userById(room.get('users'), "USERID")).should.be.true;
    });
  });
});


describe('room model', function(){
  var testRoom = new Models.Room(THE_TESTING_ROOM);
  
  before(function(){
    sinon.stub(testRoom, 'createChannelAjax', mockCreateChannelAjax);
  });

  describe('createchannel', function(){
    it('should create a channel', function(){
      assert.equal(testRoom.get('channels').length, 0);
      testRoom.createChannel({'lang': 'es'});
      assert.equal(testRoom.get('channels').length, 1);
      assert.equal(testRoom.get('channels')[0].lang, 'es');
    });
  });
  
  describe('isUserMuted', function(){

    it('should determine if user is muted', function(){
      var id = THE_TESTING_ROOM.users[0]._id;
      testRoom.isUserMuted(id).should.eql(true);
    });
    it('should determine if user is not muted', function(){
      var id = THE_TESTING_ROOM.users[1]._id;
      testRoom.isUserMuted(id).should.eql(false);
    });
  });

  describe('fetchByNum', function(){
    it("gets room info and then updates the room's attributes", function(){
      var room  = new Models.Room({roomnum: 4858});
      sinon.stub(room, 'fetchByNumAjax', function(){
        return {
          done: function(callback) {
            callback(THE_TESTING_ROOM);
          }
        };
      });
      (typeof room.get('creator')).should.eql('undefined');
      room.fetchByNum();
      room.get('creator').should.eql('56b3c680b71df7e02b280bde');
    });
  });

  describe('Methods that trigger custom events', function(){

    before(function(){
      sinon.stub(Models, 'updateChannelAjax', stubAjax('data'));
    });
    
    after(function(){
      Models.updateChannelAjax.restore();
    });
    
    describe('becomeInterpreter', function(){
      it('triggers becomeInterpreter', function(){
        
        var spy = sinon.spy();
        testRoom.on('becomeInterpreter', spy);
        testRoom.becomeInterpreter('user123', 'channel123');

        spy.calledOnce.should.be.true;
        spy.calledWithExactly('interpret', 'channel123').should.be.true;
      });
    });

    describe('leaveChannel', function(){
      it('triggers leaveChannel event', function(){
        var spy = sinon.spy();
        testRoom.on('leaveChannel', spy);
        testRoom.leaveChannel('user123', 'channel123');
        
        spy.calledOnce.should.be.true;
        spy.calledWithExactly('main', 'channel123').should.be.true;
      });
    });

    describe('joinChannel', function(){
      it('triggers joinChannel event', function(){
        var spy = sinon.spy();
        testRoom.on('joinChannel', spy);
        testRoom.joinChannel('user123', 'channel123');
        
        spy.calledOnce.should.be.true;
        spy.calledWithExactly('hear', 'channel123').should.be.true;

      });
    });
  });

  describe('isUserMuted', function(){
    it('determines if user is muted', function(){
      var room = new Models.Room(room6433Attr);
      room.isUserMuted("56faea72ef6b9d2e0726881e").should.eql(false);
      room.isUserMuted("56faee7eef6b9d2e07268820").should.eql(true);
    });
  });

  describe('Mute', function(){
    
    before(function(){
      app.audio = {};
      app.audio.mute = sinon.spy();
      sinon.spy($, "ajax");
      
    });

    after(function(){
      app.audio = null;
      app.user = null;
      $.ajax.restore();
    });

    it('unmutes user and sends unmute ajax request', function(){
      var room = new Models.Room(room6433Attr);
      app.user = new Models.User(MrButtonsAttr);
      room.mute(MrButtonsAttr._id);
      
      $.ajax.getCall(0).args[0].url.should.eql('/room/id/56faea72ef6b9d2e0726881f/unmute');
      $.ajax.getCall(0).args[0].data._id.should.eql(MrButtonsAttr._id);
      app.audio.mute.getCall(0).args[0].should.eql('unmute');
    });

    it('mutes user and sends mute ajax request', function() {
      var room = new Models.Room(room6433Attr);
      app.user = new Models.User(AliceAttr);
      room.mute(AliceAttr._id);
      
      $.ajax.getCall(1).args[0].url.should.eql('/room/id/56faea72ef6b9d2e0726881f/mute');
      $.ajax.getCall(1).args[0].data._id.should.eql(AliceAttr._id);
      app.audio.mute.getCall(1).args[0].should.equal('mute');
    });
  });

  describe('serverErrorCheck', function(){

    it("returns true if there is no error and false if there is an error", function(){
      var room = new Models.Room({});
      room.serverErrorCheck({'error': 'some error message'}).should.be.false;
      room.serverErrorCheck(room6433Attr).should.be.true;
    });

  });

  
});
