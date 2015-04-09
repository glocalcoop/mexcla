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
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());



app.get('/', function(req, res){
  res.render("index.jade");
});

app.listen(8080);
