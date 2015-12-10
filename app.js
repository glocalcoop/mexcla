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

// creates users and sends back info
app.post('/users/new', function(req, res){
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

// create room
app.get('/room/:roomnum/create', function(req,res){
  
})

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

