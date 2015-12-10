'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// channelSchema - to be implemented at a later date
// var channelSchema = new Schema({
//   lang: { type: String },
//   users: [{ type: Schema.ObjectId }],
//   translator: {type: Schema.ObjectId}
// });

var roomSchema = new Schema({
  roomnum: { type: Number, unique: true },
  users: [{ type: Schema.ObjectId, default: [] }],
  //channels: [channelSchema],
  moderator: {type: Schema.ObjectId},
  active: Boolean
});


roomSchema.methods.addUser = function(userId) {
  this.users.push(userId);
  return this.users;
}

roomSchema.methods.setModerator = function(userId) {
  this.moderator = userId;
  return userId;
}

// Export the User model
module.exports = mongoose.model('Room', roomSchema);

