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
      username: 'FAKE SPANISH USER' },
    { lang: 'en',
      _id: '56b3c680b71df7e02b280be0',
      username: 'FAKE ENGLISH USER' } ] 
};

var mockCreateChannelAjax = function(info) {
  return {
    done: function(next) {
      var room = _.extend(THE_TESTING_ROOM, {channels:[{"lang":"es","_id":"56b3d01331301f243699d1d0","users":[]}]});
      next(room);
    }
  };
};


describe('room model', function(){
  
  var testRoom = new Models.Room(THE_TESTING_ROOM);

  before(function(){
    simple.mock(testRoom, 'createChannelAjax', mockCreateChannelAjax);
  });

  it('should create a channel', function(){
    assert.equal(testRoom.get('channels').length, 0);
    testRoom.createChannel({'lang': 'es'});
    assert.equal(testRoom.get('channels').length, 1);
    assert.equal(testRoom.get('channels')[0].lang, 'es');
  });
});
