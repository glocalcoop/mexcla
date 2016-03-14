var _ = require("underscore");

//recursive function to find an available room
//callback with room number
function generateRoomNumber(roomModel, callback) {
  var randomNumber = randomInt(100,9999); // room numbers are at least 3 digits and no more than 4
  isRoomNumAvailable(roomModel, randomNumber, function(answer){
    if (answer) {
      callback(randomNumber);
    } else {
      generateRoomNumber(callback);
    }
  });
}

function isRoomNumAvailable(roomModel, roomNumber, callback) {
  roomModel.find({},'roomnum', function(err, rooms){
    var roomInUse = _.chain(rooms)
          .map(function(room){
            return room.roomnum;
          })
          .contains(roomNumber)
          .value();
    callback(!roomInUse);
  });
}


function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

//returns True or False if user is in the room.
function isUserInRoom(userId, users) {
  if (_.isUndefined(_.find(users, function(user){
    return user._id.equals(userId);
  }))) {
    return false;
  } else {
    return true;
  }
}

// input: [], string
// output: []
// removes user with given userId from queue
function removeFromQueue(queue, userId) {
 return  _.reject(queue, function(user){
      return user._id.equals(userId);
  });
}

module.exports = {
  generateRoomNumber: generateRoomNumber,
  isRoomNumAvailable: isRoomNumAvailable,
  isUserInRoom: isUserInRoom,
  removeFromQueue: removeFromQueue
};
