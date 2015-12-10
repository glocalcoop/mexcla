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


// var Room = require('./models/Room').Room;
var models = {
  User: require('./models/User'),
  Room: require('./models/Room')
};

var homepage = require('./homepage');

app.get('/', function(req, res){
  // person is logged in
  if (typeof req.cookies.id !== 'undefined') {
    models.User.findById(req.cookies.id, function(err, user){
      // get language details for page
      var homePageText = _.isUndefined(homepage[user.lang]) ? homepage.en : homepage[user.lang];
      res.json(_.extend({user: user}, homePageText));
    });
  } else {
    //prompt them to log in
    res.json(_.extend({user: 'none'}, homepage.en));
  }
});

app.post('/users/new', function(req, res){
  console.log(req.body);
  var user = new models.User(req.body);
  user.save(function(err, user){
    if (err) {
      //handle error
      console.error(err);
      res.send('ERROR');
    } else {
      //console.log(user._id);
      res.cookie('id', user._id);
      res.send(user);
    }
  });
  
  //create new users -> take back to room login page
});

app.get('/room/:roomnum', function(req,res){
  var id = req.cookie.id;
  var roomNum = req.params.roomnum;
  if (roomExists()) {
    // put user in the room
  } else {
    // create room
  }
});

app.get('/room/:roomnum/info', function(req, res){
  //return with information about room
});

app.get('/room/:roomnum/leave', function(req,res){
  removeUserFromRoom(id, roomnum);
  // take back to room-splash page
});

app.listen(8080);
