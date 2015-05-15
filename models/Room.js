'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Create the Room model for mongodb
/*module.exports = function(mongoose) {
  var RoomSchema = new mongoose.Schema({
    room: { type: String, unique: true },
    users: { type: Array },
  });

  var Room = mongoose.model('Room', RoomSchema);

  var createRoomCallback = function(err) {
    if (err) {
      return console.log(err);
    };
    return console.log('Room was created');
  };

  var createRoom = function(roominfo) {
    console.log('Creating room ' + roominfo.roomnum);
    var room = new Room({
      room: roominfo.roomnum,
      users: roominfo.users
    });
    room.save(createRoomCallback);
    return console.log('Save command was sent');
  }
  return {
    createRoom: createRoom,
    Room: Room
  }
}*/

// define the userSchema
var roomSchema = new Schema({
  roomnum   : { type: String, unique: true },
  users  : { type: Array }
});

// Export the User model
exports.Room = mongoose.model('Room', roomSchema);
