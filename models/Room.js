'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var channelSchema = new Schema({
  lang: { type: String },
  users: [{ type: Schema.ObjectId }],
  translator: {type: Schema.ObjectId}
});

var roomSchema = new Schema({
  roomnum: { type: Number, unique: true },
  users: [{ type: Schema.ObjectId }],
  channels: [channelSchema],
  moderator: {type: Schema.ObjectId},
  active: Boolean
});

// Export the User model
module.exports = mongoose.model('Room', roomSchema);
