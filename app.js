'use strict';

var express = require('express');
var mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect('mongodb://127.0.0.1:27017/mexcladb');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var _ = require('underscore');
var util = require('./util.js');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
server.listen(8080, function(){
  console.log('Mexcla is starting up at localhost:8080');
});

/**
 * Hold Room Namespaces
 */
var namespaces = {};

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser("secret"));

var models = {
  User: require('./models/User'),
  Room: require('./models/Room').Room,
  Channel: require('./models/Room').Channel
};

/**
 * Create User
 * Creates users,  sends back info and stores userid & lang in cookie
 */
app.post('/users/new', function(req, res){
  var user = new models.User(req.body);
  user.save(function(err, user){
    if (err) {
      //handle error
      console.error(err);
      res.send('ERROR');
    } else {
      res.cookie('id', user.id);
      // store language in a cookie
      res.cookie('lang', user.lang);
      res.json(user);
    }
  });
});

/**
 * Get User Info
 * Responds to user.fetch() in backbone
 */
app.get('/users/:id', function(req,res){
  getFullUserInfo(req.params.id, function(user){
    res.json(user);
  });
});

/**
 * Create Room
 */
app.get('/room/create', function(req,res){
  var userId = req.cookies.id;
  createRoomRandom(req,res,userId);
});

/**
 * Join/re-join room
 */
app.get('/room/:roomnum', function(req,res){
  var userId = req.cookies.id;
  roomByRoomNumber(req.params.roomnum, function(room){
    if (!room) {
      // catch error in case room doesn't exist:
      createRoom(req, res, userId, req.params.roomnum);
      return;
    }
    if (util.isUserInRoom(userId, room.users)) {
      res.json(room);
    } else {
      getUserInfo(userId, function(userInfo){
        room.users.push(userInfo);
        room.save(function(err, roomInfo){
          if (err) {handleError(err);}
          res.json(roomInfo);
          emitRoom(roomInfo);
        });
      });
    }
  });
});

app.get('/room/id/:id', function(req,res){
  models.Room.findById(req.params.id, function(err,room){
    if (err) {console.log(err);}
    res.json(room);
  });
});

app.post('/room/id/:id/moderator', function(req, res){
  models.Room.findById(req.params.id, function(err, room){
    if (err) {console.log(err);}
    room.moderator = req.body.moderator;
    room.save(function(err, roomInfo){
      if (err) {
        res.json({error: "Error changing the moderator", "message": err});
      } else {
        res.json(roomInfo);
        emitRoom(roomInfo);
      }
    });
  });
});

/**
 * Create Channel
 */
app.post('/room/id/:id/channel/create', function(req,res){
  models.Room.findById(req.params.id, function(err, room){
    if (err) {handleError(err);}
    room.channels.push(req.body);
    room.save(function(err){
      if (err) {
        res.json({error: "error creating the channel"});
      } else {
        res.json(room);
        emitRoom(room);
      }
    });
  });
});


/**
 * Update Channel
 * post data {'channelField': "new data"}. i.e.: {"interpreter": "slothrop", lang: "es"}
 */
app.post('/room/id/:roomid/channel/:channelid/update', function(req,res){
  getChannel(req.params.roomid, req.params.channelid, function(channelDoc){
    channelDoc.set(req.body);
    // TODO: add emitRoom to this callback
    channelDoc.ownerDocument().save(function(err){
      if (err) {
        res.json({error: "Error updating the channel", errorMessage: err});
      } else {
        res.json(channelDoc);
      }
    });
  });
});

/**
 * Join Channel
 * 
 */
app.post('/room/id/:roomid/channel/:channelid/join', function(req,res){
  models.Room.findById(req.params.roomid, function(err, room) {
    var channel = room.channels.id(req.params.channelid);
    channel.users.push(req.body._id);
    room.save(function(err, roomInfo){
      if (err) {handleError(err);}
      res.json(roomInfo);
      emitRoom(roomInfo);
    });
  });
});


/**
 * Join Channel as Interpreter
 * 
 */
app.post('/room/id/:roomid/channel/:channelid/interpret', function(req,res){
  models.Room.findById(req.params.roomid, function(err, room) {
    var channel = room.channels.id(req.params.channelid);
    channel.users.push(req.body._id);
    channel.interpreter = req.body._id;
    room.save(function(err, roomInfo){
      if (err) {handleError(err);}
      res.json(roomInfo);
      emitRoom(roomInfo);
    });
  });
});


/**
 * Leave Channel
 * 
 */
app.post('/room/id/:roomid/channel/:channelid/leave', function(req,res){
  models.Room.findById(req.params.roomid, function(err, room) {
    var channel = room.channels.id(req.params.channelid);
    channel.users = removeUserFromChannel(channel.users, req.body._id);
    channel = removeInterpreterFromChannel(channel, req.body._id);
    room.save(function(err){
      if (err) {handleError(err);}
      res.json(room);
      emitRoom(room);
     });
    });
});


/**
 * Raise Hand
 * TODO: error handling
 */
app.post('/room/id/:id/raisehand', function(req, res){
  userAndRoom(req.cookies.id, req.params.id, function(user, room){
    room.handsQueue.push(user);
    room.save(function(err, roomInfo){
        if (err) {handleError(err);}
        res.json(roomInfo);
        emitRoom(roomInfo);
      });
    });
});

/**
 * Lower Hand
 */
app.post('/room/id/:id/lowerhand', function(req,res){
  models.Room.findById(req.params.id, function(err,room){
    room.handsQueue = util.removeFromQueue(room.handsQueue, req.cookies.id);
    room.save(function(err, roomInfo){
      if (err) {handleError(err);}
      res.json(roomInfo);
      emitRoom(roomInfo);
    });
  });
});

/**
 * Call On
 */
app.post('/room/id/:id/callon', function(req,res){
  callOn(req.body._id, req.params.id, function(room){
    res.json(room);
    emitRoom(room);
  });
});

/**
 * Call Off
 */
app.post('/room/id/:id/calloff', function(req, res){
  callOff(req.body._id, req.params.id, function(room){
    res.json(room);
    emitRoom(room);
  });

});

/**
 * Mute and unmute
 */

app.post('/room/id/:id/mute', function(req, res){
  muteOrUnmute('mute', req.params.id, req.body._id, res);
});

app.post('/room/id/:id/unmute', function(req, res){
  muteOrUnmute('unmute', req.params.id, req.body._id, res); 
});

/**
 * TODO:Leave Room
  */
app.get('/room/:roomnum/leave', function(req,res){
  removeUserFromRoom(req.cookies.id, req.params.roomnum, function(room){
    getFullUserInfo(req.cookies.id, function(user){
      res.json(user);
    });
  });
});

//FUNCTIONS//
/**
 * Create Random Room Number
 * Creates a room with a random number
 */
function createRoomRandom(req, res, userId) {
  util.generateRoomNumber(models.Room, function(newRoomNumber){
    createRoom(req,res,userId,newRoomNumber);
  });
}

/**
 * Create Room
 * Create a new room with the provided room number
 * Note: this does NOT check if the room number exists.
 * When used by createRoomRandom, util.generateRoomNumber only generate a random number that is available, ensuring there are no duplicates. When used in route /room/:room,  it checks for existing rooms first by attempting to get info for an existing room.
 *
 */
function createRoom(req, res, userId, newRoomNumber) {
  var moderated = (!_.isUndefined(req.query.moderated) && req.query.moderated == 'true') ? true : false;
  var moderator = (moderated) ? userId : null;
  var room = new models.Room({
    roomnum: newRoomNumber, 
    active: true, 
    creator: userId,
    isModerated: moderated,
    moderator: moderator 
  });
  console.log(room);
  //get user info for our logged in user
  getUserInfo(userId, function(userInfo){
    room.addUser(userInfo, function(err){
      if (err) { console.log(err);}
      //save the room to the db
      room.save(function(err, roomInfo){
        if (err) {
          console.log('error creating room' + err);
          res.json({'error': 'error creating room'});
        } else {
          res.json(room);
          // creates a socket.io namepsace for this room
          namespaces['' + newRoomNumber] = io.of('/' + newRoomNumber);
        }
      });
    });
  });
}

/**
 * Call On
 * String, string -> callback({})
 * Removes user of userId from Queue and  places them in the called on position.
 */
function callOn(userId, roomId, callback){
  userAndRoom(userId, roomId, function(user, room){
    room.calledon = user;
    room.handsQueue = util.removeFromQueue(room.handsQueue, userId);
    room.save(function(err, roomInfo){
      (err) ? callback(err) : callback(roomInfo);
    });
  });
}

/**
 * Call Off
 * String, string -> callback({})
 * Removes from the calledon position if they are currently called on
 */
function callOff(userId, roomId, callback){
  models.Room.findById(roomId, function(err, room){
    if (err) {handleError(err);}
    if (room.calledon && room.calledon._id.equals(userId)) {
      room.calledon = false;
      room.save(function(err, roomInfo){
        (err) ? callback(err) : callback(roomInfo);
      });
    } else {
      console.log({'error': "Hey! That person wasn't called on"});
      callback(room);
    }
  });
}

/**
 * User and Room
 * string, string -> callback(user, room);
 * if err: callback(err);
 */
function userAndRoom(userId, roomId, callback) {
  var userPromise = getUsernameAndLangPromise(userId);
  var roomPromise = models.Room.findById(roomId).exec();
  Promise.all([userPromise,roomPromise]).then(function(values){
    callback(values[0], values[1]);
  }, function(reason){
    callback(reason);
  });
}

/**
 * userId -> promise
 */
function getUsernameAndLangPromise(userId) {
  return models.User.findById(userId, 'username lang').exec();
}

/**
 * passes user info object {_id,username,lang} to callback
 */
function getFullUserInfo(userId, callback) {
  models.User.findById(userId, function(err, user){
    if (err) {handleError(err);}
    callback(user);
  });
}

/**
 * passes user info object {_id,username,lang, isMuted} to callback
 */
function getUserInfo(userId, callback) {
  models.User.findById(userId, 'username lang', function(err, user){
    if (err) {handleError(err);}
    // adds isMuted field. This information does not need to be permanently stored with the user's information, but its need to be kept with the room.
    user.isMuted = false;
    callback(user);
  });
}

function roomByRoomNumber(roomNumber, callback) {
  models.Room.findOne({roomnum: roomNumber}, function(err, room){
    if (err) {handleError(err);}
    callback(room);
  });
}

function removeUserFromRoom(id, roomNumber, callback) {
  roomByRoomNumber(roomNumber, function(room){
    room.users = _.reject(room.users, function(user){
        return user._id.equals(id);
    });
    room.save(function(err,room){
      if (err) {handleError(err);}
      callback(room);
    });
  });
}

/**
 * @param {array} - Users
 * @param {string} - Userid of user that should be removed
 */
function removeUserFromChannel (users, userToRemove) {
  return _.reject(users, function(userId){
    return userId === userToRemove;
  });
}

/**
 * @param {object} - channel
 * @param {string} - Userid of user that should be removed
 * @returns {object} - channel
 */
function removeInterpreterFromChannel(channel, userId) {
  if(!_.isUndefined(channel.interpreter) && channel.interpreter === userId) {
     channel.interpreter = '';
  }
  return channel;
}

/**
 * Input: @string roomId, @string channelid
 * Output: @callback channelDoc
 */
function getChannel(roomId, channelId, callback) {
  models.Room.findById(roomId, function(err, room){
    if (err) {handleError(err);}
    callback(room.channels.id(channelId));
  });
}

/**
 * @param {boolean} - updated isMuted status
 * @param {string} - userId
 * @return {function}
 */
function changeMuteStatus(status, userId) {
  return function(user) {
    if (user._id.equals(userId)) {
      user.isMuted = status;
      return user;
    } else {
      return user;
    }
  };
}
/**
 * @param {string} - 'mute' or 'unmute'
 * @param {string} - roomrid
 * @param {string} - userId
 * @param {object} - response object from express
 */

function muteOrUnmute(action, roomId, userId, res) {
  var isMutedStatus = (action === 'mute') ? true : false;
  console.log(isMutedStatus);
  models.Room.findById(roomId, function(err, room){
    if (err) {handleError(err);}
    room.users  = _.map(room.toObject().users, changeMuteStatus(isMutedStatus, userId));
    room.save(function(err){
      if (err) {
        console.error(err);
      } 
      res.json(room);
      emitRoom(room);
    });
  });
}

/**
 * pushes a 'room update' event to the namespace for the given room
 */
function emitRoom(room) {
  if (_.isUndefined(namespaces[room.roomnum])) {
    console.error({error: 'room namespace is undefined'});
    // create name space
    // after a server crash, we have to re-create the namespaces
    namespaces['' + room.roomnum] = io.of('/' + room.roomnum);
  }
  namespaces[room.roomnum].emit('room update', room);
}

/**
 * Add fancier error handling some day
 */
function handleError(err) {
  console.error(err);
}
