Models.raiseHandAjax = function(roomId) {
  return $.ajax({
    type: 'POST',
    url: '/room/id/' + roomId + '/raisehand'
  });
};

Models.lowerHandAjax = function(roomId) {
  return $.ajax({
    type: 'POST',
    url: '/room/id/' + roomId + '/lowerhand'
  });
};

Models.callOnAjax = function(roomId, personCalledOnId) {
  return $.ajax({
    type: 'POST',
    url: '/room/id/' + roomId + '/callon',
    data: {
      _id: personCalledOnId
    }
  });
};

Models.callOffAjax = function(roomId, personCalledOnId) {
  return $.ajax({
    type: 'POST',
    url: '/room/id/' + roomId + '/calloff',
    data: {
      _id: personCalledOnId
    }
  });
};

/**
 * Issues mute or unmute http request
 * @param {string} - 'mute' or 'unmute'
 * @param {string} - roomid
 * @param {string} - userid
 */
Models.muteAjax = function(action, roomId, userId) {
  return $.ajax({
    type: 'POST',
    url: '/room/id/' + roomId + '/' + action,
    data: {
      _id: userId
    }
  });
};

/**
 * @param {string} - action: 'join' or 'leave'
 * @param {string} - roomId
 * @param {string} - channelId
 * @param {string} - userId
 * @returns {jqHXR}
 */
Models.updateChannelAjax = function(action, roomId, channelId, userId) {
  return $.ajax({
    type: 'POST',
    url: '/room/id/' + roomId + '/channel/' + channelId + '/' + action,
    data: {
      _id: userId
    }
  });
};

Models.util.room = {};

Models.util.room.userById = function(users, userid) {
  return _.find(users, function(user) {
    return user._id === userid;
  });
};

/**
 * Checks if the server responded with an error message
 * @param {string} userid
 * @returns {boolean}
 */
Models.util.room.serverErrorCheck = function(res) {
  if (_.has(res, 'error')) {
    console.log('error message received: ' + res.error);
    return false;
  } else {
    return true;
  }
};
