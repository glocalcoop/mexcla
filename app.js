'use strict';

var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var _ = require('underscore');
var util = require('./util.js');
//var expressSession = require('express-session');
//var MongoStore = require('connect-mongo')(expressSession);
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
server.listen(8080, function(){
  console.log('Mexcla is starting up at localhost:8080');
});

// holds room namespaces
var namespaces = {};

//var io = require('socket.io')(server);
mongoose.Promise = Promise;
mongoose.connect('mongodb://127.0.0.1:27018/mexcladb_test');

app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser("TOP SnECRET"));

app.use(express.static('public'));

var models = {
  User: require('./models/User'),
  Room: require('./models/Room').Room,
  Channel: require('./models/Room').Channel
};

var homepage = require('./homepage');

//app.get('/', homepageRequest);

// creates users and sends back info and puts userid in cookie
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
      res.send(user);
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
  util.generateRoomNumber(models.Room, function(newRoomNumber){
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
  });
});

// join/re-join room
app.get('/room/:roomnum', function(req,res){
  var userId = req.cookies.id;
  roomByRoomNumber(req.params.roomnum, function(room){
    if (isUserInRoom(userId, room.users)) {
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

//room info
app.get('/room/:roomnum/info', function(req, res){
  //return with information about room
});

//leave room and respond with user info
//NOTE: perhaps add a message or boolean to indicate to the front-end that it needs to display the home page?
app.get('/room/:roomnum/leave', function(req,res){
  removeUserFromRoom(req.cookies.id, req.params.roomnum, function(room){
    homepageRequest(req, res);
  });
});



//FUNCTIONS//

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

function homepageRequest(req, res) {
  // person is logged in
  if (!_.isUndefined(req.cookies.id)) {
    getUserInfo(req.cookies.id, function(user){
      // get language details for page
      var homePageText = _.isUndefined(homepage[user.lang]) ? homepage.en : homepage[user.lang];
      //send user info + language-specific details for homepage
      res.json(_.extend({user: user}, homePageText));
    });
  } else {
    //send English by default 
    res.json(_.extend({user: 'none'}, homepage.en));
  }
}

//returns True or False if user is in the room.
function isUserInRoom(userId, users) {
  if (_.isUndefined(_.find(users, function(user){
    return user._id.equals(userId);
  }))) {
    return false;
  } else {
    return true;
  }
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
