'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var channelSchema = new Schema({
   name: { type: String },
   lang: { type: String },
   users: { type: Array },
   interpreter: { type: String }
 });

var roomSchema = new Schema({
  roomnum: { type: Number, unique: true },
  // user: {_id, lang, username}
  users: {type: Array, default: []},
  creator: {type: Schema.Types.ObjectId},
  active: Boolean,
  isModerated: Boolean,
  moderator: {type: Schema.Types.ObjectId},
  channels: [channelSchema],
  isPrivate: Boolean,
  handsQueue: {type: Array, default: []},
  calledon: Schema.Types.Mixed
});

roomSchema.methods.addUser = function(userInfo, cb) {
  this.users.push(userInfo);
  cb();
};

roomSchema.methods.setModerator = function(userId) {
  userId = (this.isModerated) ? userId : null;
  this.moderator = userId;
  return userId;
};

channelSchema.methods.addUser = function(userInfo, cb) {
  this.users.push(userInfo);
  cb();
};

channelSchema.methods.setInterpreter = function(userId) {
  this.interpreter = userId;
  return userId;
}

// Export the model
module.exports.Room = mongoose.model('Room', roomSchema);
module.exports.Channel = mongoose.model('Channel', channelSchema);
