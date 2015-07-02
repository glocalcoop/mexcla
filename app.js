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
    store: new MongoStore({ mongooseConnection: mongoose.connection   }),
    autoRemove: 'interval',
    autoRemoveInterval: 60
}));
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

// var Room = require('./models/Room').Room;
var models = {
  User: require('./models/User')(mongoose)
};

app.get('/', function(req, res){
  if(req.session.lang == undefined) {
    req.session.lang == 'en';
  }
  if(req.session.lang == 'es') {
    if(req.session.username) {
      res.render("index.jade", {title: "Sistema de Conferencia Interpretación simultánea",
                               username: "Hola, " + req.session.username,
                               lang: req.session.lang});
    }else{
       res.render("index.jade", {title: "Sistema de Conferencia Interpretación simultánea",
                                username: "",
                                lang: req.session.lang});
    }
  }else{
    if(req.session.username) {
      res.render("index.jade", {title: "Simultaneous Interpretation Conference System",
                               username: "Hi, " + req.session.username,
                               lang: req.session.lang});
    }else{
       res.render("index.jade", {title: "Simultaneous Interpretation Conference System",
                                username: "",
                                lang: req.session.lang});
    }
    // res.render("index.jade", {title: "Simultaneous Interpretation Conference System"});
  }
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

app.get('/sess-room/:roomnum', function(req, res) {
  // var sess = req.session;
  req.session.roomnum = req.params.roomnum;
  console.log(req.session);
/*  if(req.session.username && req.session.roomnum) {
    models.User.findOneAndUpdate(req.session.username,
                                 req.session.roomnum,
                                 'en',
                                 req.sessionID);
  };*/
  res.sendStatus(200);
  // return next();
});

app.get('/userinfo', function(req, res) {
  res.render('user-form.jade');
});

app.get('/check-user', function(req, res, next) {
  models.User.findBySessionId(req.sessionID, function(user) {
    res.send(user);
  });
});

app.get('/sess-destroy', function(req, res) {
  req.session.destroy();
  models.User.remove(req.sessionID, function(result) {
    res.send(result);
  });
  res.redirect('/');
});

app.get('/rooms/:num/users', function(req, res, next) {
  models.User.findUsersByRoom(req.params.num, function(users) {
    // console.log(users);
    res.send(users);
  });
});

app.get('/rooms/:roomnum/status', function(req, res, next) {
  Room.findOne(req.session.room, function(err, room){
    if(err) res.send(err);
    res.json(room);
  });
});

app.get('/remove', function(req, res) {
  console.log("Session id from remove");
  console.log(req.sessionID);
  if(!req.session.username) {
    models.User.remove(req.sessionID, function(result) {
      res.send(result);
   });
  }
});

app.get('/lang/:lang', function(req, res, next) {
  console.log(req.params.lang);
  console.log(req.sessionID);
  var lang = req.params.lang.replace(/:/g,'');
  if(req.session.username) {
    models.User.findOneAndUpdate(req.sessionID, lang);
  }
  req.session.lang = lang;
  res.send(200);
});

app.post('/username', function(req, res) {
  console.log("This is req.body");
  console.log(req.body);
  var sess = req.session;
  sess.username = req.body.username;
  // Update the user document with nickname
  models.User.register(req.body.username, sess.roomnum, 'en', req.sessionID);
  // console.log("This sould be post session.");
  // console.log(sess);
  // console.log(JSON.stringify(req.body));
  // console.log(req.body);
  // console.log(req.get('referer'));
  // res.redirect('/#room/42');
  // res.sendStatus(201);
  // res.send(req.body.username);
  res.redirect('/#room/' + req.session.roomnum);
});

app.post('/gotoroom', function(req, res, next) {
  if(req.body.roomnumber) {
    res.redirect('/#room/' + req.body.roomnumber);
    // res.url = '/#room/' + req.body.roomnumber;
    // res.location.hash = 'room/' + req.body.roomnumber;
  }else{
    res.redirect('/#room/' + Math.round(Math.random() * (99999 - 1) + 1));
    // res.url = '/#room/' + Math.round(Math.random() * (99999 - 1) + 1);
    // res.location.hash = 'room/' + Math.round(Math.random() * (99999 - 1) + 1);
  }
});


app.listen(8080);
