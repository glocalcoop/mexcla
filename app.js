var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
//var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);
var app = express();

mongoose.connect('mongodb://localhost/mexcladb_test');


app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());


// var Room = require('./models/Room').Room;
var models = {
  User: require('./models/User'),
  Room: require('./models/Room')
};

app.get('/', function(req, res){
  // person is logged in
  if (req.cookie.id) {
    if (isPersonInAnActiveRoom(id)) {
      //take them to that room
    } else {
      //take them to the room selection page
    }
  } else {
    //prompt them to log in
  }
});

app.post('/users/new', function(req, res){
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
