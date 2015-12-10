'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var channelSchema = new Schema({
  lang: { type: String },
  users: [{ type: ObjectId }],
  translator: {type: ObjectID}
});

var roomSchema = new Schema({
  roomnum: { type: Number, unique: true },
  users: [{ type: ObjectId }],
  channels: [channelSchema],
  moderator: {type: ObjectId},
  active: Boolean
});

// Export the User model
module.exports = mongoose.model('Room', roomSchema);
