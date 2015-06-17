var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);
var app = express();

mongoose.connect('mongodb://localhost/mexcladb');
app.use(expressSession({
    secret: "Our Secret Key",
    store: new MongoStore({ mongooseConnection: mongoose.connection   })
}));
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

var Room = require('./models/Room').Room;

app.get('/', function(req, res){
  res.render("index.jade");
});

app.get('/room/:roomnum', function(req, res){
  var num = req.params.roomnum;
  var sess = req.session;
  sess.room = num;
  var roominfo = {
    roomnum: num,
    users: []
  }
  Room.create(roominfo);
  // expressSession.room = num
  console.log(sess);
  res.render("room.jade", {roomNum: num});
});

app.get('/session', function(req, res, next) {
  res.json(req.session);
  return next();
  console.log(req.session);
});

app.get('/userinfo', function(req, res) {
  res.render('user-form.jade');
});

app.get('/sess-destroy', function(req, res) {
  req.session.destroy();
  res.redirect('/');
});

app.get('/rooms/:roomnum/users', function(req, res, next) {
  Room.findOne(req.session.room, function(err, room){
    if(err) res.send(err);
    res.json(room);
  });
});

app.get('/rooms/:roomnum/status', function(req, res, next) {
  Room.findOne(req.session.room, function(err, room){
    if(err) res.send(err);
    res.json(room);
  });
});

app.post('/username', function(req, res) {
  var sess = req.session;
  sess.username = req.body.username;
  // Update the room document
  Room.findOneAndUpdate(
    {roomnum: sess.room},
    {$push: {users: req.body.username}},
    {safe: true, upsert: true},
    function(err, model) {
      console.log(err);
    }
  );
  console.log("This sould be post session.");
  console.log(sess);
  console.log(JSON.stringify(req.body));
  console.log(req.body);
  res.redirect(req.get('referer'));
});

app.post('/gotoroom', function(req, res, next) {
  if(req.body.roomnumber) {
    // res.redirect('/#room/' + req.body.roomnumber);
    res.url = '/#room/' + req.body.roomnumber;
    // res.location.hash = 'room/' + req.body.roomnumber;
  }else{
    // res.redirect('/#room/' + Math.round(Math.random() * (99999 - 1) + 1));
    res.url = '/#room/' + Math.round(Math.random() * (99999 - 1) + 1);
    // res.location.hash = 'room/' + Math.round(Math.random() * (99999 - 1) + 1);
  }
});


app.listen(8080);
