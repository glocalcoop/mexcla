// Create the Room model for mongodb
module.exports = function(config, mongoose) {
  var RoomSchema = new mongoose.Schema({
    room: { type: String, unique: true },
  });

  var Room = mongoose.model('Room', RoomSchema);

  return {
    Room: Room
  }
}
