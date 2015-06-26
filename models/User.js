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

  var remove = function(sessID, callback) {
    User.remove({sess: sessID}, function(err) {
      if(!err) {
        console.log("User removed");
      }else{
        console.log("An error occurred, user not removed");
        callback(err);
      }
    });
  };

  var findOneAndUpdate = function(sess, lang) {
    User.findOneAndUpdate(
      {sess: sess},
      {lang: lang},
      {safe: true, upsert: true},
      function(err, model) {
        if(err) {
          console.log(err);
        }else{
          console.log(model);
        }
      }
    );
  };

  return {
    findByRoom: findByRoom,
    findBySessionId: findBySessionId,
    findUsersByRoom: findUsersByRoom,
    register: register,
    remove: remove,
    findOneAndUpdate: findOneAndUpdate,
    User: User
  }
};
