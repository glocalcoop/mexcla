'use strict';

var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var _ = require('underscore');
//var expressSession = require('express-session');
//var MongoStore = require('connect-mongo')(expressSession);
var app = express();

mongoose.connect('mongodb://localhost/mexcladb_test');

app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser("TOP SECRET"));

var models = {
  User: require('./models/User'),
  Room: require('./models/Room')
};

var homepage = require('./homepage');

app.get('/', function(req, res){
  // person is logged in
  if (!_.isUndefined(req.cookies.id)) {
    models.User.findById(req.cookies.id, function(err, user){
      // get language details for page
      var homePageText = _.isUndefined(homepage[user.lang]) ? homepage.en : homepage[user.lang];
      //send user info + language-specific details for homepage
      res.json(_.extend({user: user}, homePageText));
    });
  } else {
    //send English by default 
    res.json(_.extend({user: 'none'}, homepage.en));
  }
});

// creates users and sends back info and puts userid in cookie
app.post('/users/new', function(req, res){
  var user = new models.User(req.body);
  user.save(function(err, user){
    if (err) {
      //handle error
      console.error(err);
      res.send('ERROR');
    } else {
      res.cookie('id', user._id);
      res.send(user);
    }
  });
});

// create room
app.get('/room/create', function(req,res){
  var userId = req.cookies.id;
  var randomNumber = 1234; // gotta make this actually random some day
  var room = new models.Room({roomnum: randomNumber, active: true, moderator: userId, creator: userId});

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
        }
      });
    });
  });
  
});

// join/re-join room
app.get('/room/:roomnum', function(req,res){
  var userId = req.cookies.id;
  var roomNumber = req.params.roomnum;
  
  models.Room.findOne({roomnum: roomNumber}, function(err, room){
    if (err) {handleError(err);}
    if (isUserInRoom(userId, room.users)) {
      res.json(room);
    } else {
      getUserInfo(userId, function(userInfo){
        room.users.push(userInfo);
        room.save(function(err, roomInfo){
          if (err) {handleError(err);}
          res.json(roomInfo);
        });
      });
    }
  });
});

//room info
app.get('/room/:roomnum/info', function(req, res){
  //return with information about room
});

//leave room
app.get('/room/:roomnum/leave', function(req,res){
  removeUserFromRoom(id, roomnum);
  // take back to room-splash page
});

app.listen(8080);


//FUNCTIONS//

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
  models.User.findById(userId, 'username lang', function(err, user){
    if (err) {handleError(err);}
    callback(user);
  });
}

//so something fancier one day
function handleError(err) {
  console.error(err);
}

function isRoomNumAvailable(roomNumber, callback) {
  models.Room.find({},'roomnum', function(err, rooms){
    var roomInUse = _.chain(rooms)
          .map(function(room){
            return room.roomnum;
          })
          .contains(roomNumber)
          .value();
    callback(!roomInUse);
  });
}

module.exports.isRoomNumAvailable = isRoomNumAvailable;
