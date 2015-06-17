'use strict';

module.exports = function(mongoose) {
  var userSchema = new mongoose.Schema({
    username : { type: String },
    roomnum : { type: String },
    lang : { type: String, default: 'en' },
    sess : { type: String, unique: true }
  });

  var User = mongoose.model( 'User', userSchema );

  var registerCallback = function(err) {
    if (err) {
      return console.log(err);
    };
    return console.log('Account was created');
  };

  var findByRoom = function(roomNum, callback) {
    User.findOne({roomnum: roomNum}, function(err, doc) {
      callback(doc);
    });
  };

  var findBySessionId = function(sessId, callback) {
    User.findOne({ sess: sessId }, function(err, doc) {
      callback(doc);
    });
  };

  var findUsersByRoom = function(roomNum, callback) {
    User.find({roomnum: roomNum}, function(err, doc) {
      callback(doc);
    });
  };

  var findById = function(userId, callback) {
    User.findOne({_id:userId}, function(err,doc) {
      callback(doc);
    });
  };

  var register = function(userName, roomNum, lang, sessId) {
    var user = new User({
      username: userName,
      roomnum: roomNum,
      lang: lang,
      sess: sessId
    });
    user.save(registerCallback);
    console.log("resister save function sent.");
  };

  var findOneAndUpdate = function(userName, roomNum, lang, sess, callback) {
    User.findOneAndUpdate(
      {username: userName},
      {roomnum: roomNum},
      {lang: lang},
      {sess: sess},
      {safe: true, upsert: true},
      function(err, model) {
        console.log(err);
        callback(model);
      }
    );
  };

  return {
    findByRoom: findByRoom,
    findBySessionId: findBySessionId,
    findUsersByRoom: findUsersByRoom,
    register: register,
    findOneAndUpdate: findOneAndUpdate,
    User: User
  }
};
