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


describe('util', function(){
  describe('room.userByRoom', function(){
    it('should return userInfo given userid', function(){
      var user = Models.util.room.userById(THE_TESTING_ROOM.users, '56b3c680b71df7e02b280be0');
      user.username.should.eql('FAKE ENGLISH USER');
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

  describe('becomeInterpreter', function(){

    before(function(){
      sinon.stub(Models, 'updateChannelAjax', stubAjax('data'));
    });
    
    after(function(){
      Models.updateChannelAjax.restore();
    });
    
    it('triggers bcomeInterpreter', function(){
      
      var spy = sinon.spy();
      testRoom.on('becomeInterpreter', spy);
      testRoom.becomeInterpreter('user123', 'channel123');

      spy.calledOnce.should.be.true;
      spy.calledWithExactly('interpret', 'channel123').should.be.true;
    });
  });

  
});
