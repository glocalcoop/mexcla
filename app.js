'use strict';

var express = require('express');
var mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect('mongodb://127.0.0.1:27018/mexcladb_test');
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

// holds room namespaces
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

// creates users,  sends back info and stores userid & lang in cookie
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

// gets user info
// responds to user.fetch() in backbone
app.get('/users/:id', function(req,res){
  getUserInfo(req.params.id, function(user){
    res.json(user);
  });
});

// create room
app.get('/room/create', function(req,res){
  var userId = req.cookies.id;
  createRoomRandom(req,res,userId);
});

// join/re-join room
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
      getUsernameAndLang(userId, function(userInfo){
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

// create channel //
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

// update channel // 
// post data {'channelField': "new data"}. i.e.: {"interpreter": "slothrop", lang: "es"}
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

// HAND RAISE //
// TODO: error handling
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


// LOWER HAND //
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

// CALL ON ///
app.post('/room/id/:id/callon', function(req,res){
  callOn(req.body._id, req.params.id, function(room){
    res.json(room);
    emitRoom(room);
  });
});

// CALL OFF 
app.post('/room/id/:id/calloff', function(req, res){
  callOff(req.body._id, req.params.id, function(room){
    res.json(room);
    emitRoom(room);
  });

});

//leave room and respond with user info
//NOTE: perhaps add a message or boolean to indicate to the front-end that it needs to display the home page?
app.get('/room/:roomnum/leave', function(req,res){
  removeUserFromRoom(req.cookies.id, req.params.roomnum, function(room){
    getUserInfo(req.cookies.id, function(user){
      res.json(user);
    });
  });
});



//FUNCTIONS//

// creates a room with a random number
function createRoomRandom(req, res, userId) {
  util.generateRoomNumber(models.Room, function(newRoomNumber){
    createRoom(req,res,userId,newRoomNumber);
  });
}

// Create a new room with the provided room number
// note: this does NOT check if the room number exists.
// When used by createRoomRandom, util.generateRoomNumber only generate a random number that is available, ensuring there are no duplicates. When used in route /room/:room,  it checks for existing rooms first by attempting to get info for an existing room.
function createRoom(req, res, userId, newRoomNumber) {
  var room = new models.Room({roomnum: newRoomNumber, active: true, moderator: userId, creator: userId});
  //get user info for our logged in user
  getUsernameAndLang(userId, function(userInfo){
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

// string, string -> callback({})
// removes user of userId from Queue and  places them in
// the called on position.
function callOn(userId, roomId, callback){
  userAndRoom(userId, roomId, function(user, room){
    room.calledon = user;
    room.handsQueue = util.removeFromQueue(room.handsQueue, userId);
    room.save(function(err, roomInfo){
      (err) ? callback(err) : callback(roomInfo);
    });
  });
}

// string, string -> callback({})
// removes from the calledon position if they are currently called on
function callOff(userId, roomId, callback){
  models.Room.findById(roomId, function(err, room){
    if (err) {handleError(err);}
    if (room.calledon._id.equals(userId)) {
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

// string, string -> callback(user, room);
// if err:
// callback(err);
function userAndRoom(userId, roomId, callback) {
  var userPromise = getUsernameAndLangPromise(userId);
  var roomPromise = models.Room.findById(roomId).exec();
  Promise.all([userPromise,roomPromise]).then(function(values){
    callback(values[0], values[1]);
  }, function(reason){
    callback(reason);
  });
}


// userId -> promise
function getUsernameAndLangPromise(userId) {
  return models.User.findById(userId, 'username lang').exec();
}


//passes user info object {_id,username,lang} to callback
function getUserInfo(userId, callback) {
  models.User.findById(userId, function(err, user){
    if (err) {handleError(err);}
    callback(user);
  });
}

//passes user info object {_id,username,lang} to callback
function getUsernameAndLang(userId, callback) {
  models.User.findById(userId, 'username lang', function(err, user){
    if (err) {handleError(err);}
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

// input: string (roomid), string (channelid),
// output: callback(channelDoc)
function getChannel(roomid, channelid, callback) {
  models.Room.findById(roomid, function(err, room){
    if (err) {handleError(err);}
    callback(room.channels.id(channelid));
  });
}


// pushes a 'room update' event to the namespace for the given room
function emitRoom(room) {
  namespaces[room.roomnum].emit('room update', room);
}

//so something fancier one day
function handleError(err) {
  console.error(err);
}
