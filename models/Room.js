'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// channelSchema - to be implemented at a later date
var channelSchema = new Schema({
   lang: { type: String },
   users: [{ type: Schema.ObjectId }],
   interpreter: {type: Schema.ObjectId}
});

var roomSchema = new Schema({
  roomnum: { type: Number, unique: true },
  // user: {_id, lang, username}
  users: {type: Array, default: []},
  channels: {type: [channelSchema], default: []},
  moderator: {type: Schema.ObjectId},
  active: Boolean,
  creator: {type: Schema.ObjectId}
});

roomSchema.methods.addUser = function(userInfo, cb) {
  this.users.push(userInfo);
  cb();
};

roomSchema.methods.setModerator = function(userId) {
  this.moderator = userId;
  return userId;
};

roomSchema.methods.addChannel = function(channel) {
  this.channels.push(channel);
};

// Export the User model
module.exports = mongoose.model('Room', roomSchema);
