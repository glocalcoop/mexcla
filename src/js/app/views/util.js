/**
 * Create User
 * input: string, string ('en' or 'es')
 * output: jqXHR-promise
 */
Views.createUserAjax = function (username, lang) {
  return $.ajax({
    type: 'POST',
    url: '/users/new',
    data: {
      username: username,
      lang: lang
    }
  });
};

/**
 * Create Room Ajax Call
 * @param {boolean}
 * @returns {jqXHR} 
 */
Views.createRoomAjax = function(moderated) {
  return $.ajax({
    type: 'GET',
    url: '/room/create',
    data: {'moderated': moderated}
  });
};

Views.isThereAUser = function() {
  if (_.isUndefined(Cookies.get('id'))) {
    return false;
  } else {
    return true;
  }
};

Views.isModerator = function(userId) {
  return userId == app.room.get('moderator');
};

Views.isCurrentUser = function(userId) {
  return userId == app.user.id;
};

/**
 * Checks if user is in a Channel
 * @param {string} UserId
 * @returns {false|string} 
 */

Views.isInAChannel = function(userId) {
  
  var channel = _.find(app.room.get('channels'), function(channel){
    return _.contains(channel.users, userId);
  });

  return (_.isUndefined(channel)) ? false : channel.lang;
  
};

Views.hasChannelInterpreter = function(channelId) {
  var channel = _.findWhere(app.room.get('channels'), {
    _id: channelId
  });
  return channel.interpreter !== '';
};

Views.isChannelInterpreter = function(channelId, userId) {
  return _.findWhere(app.room.get('channels'), {
    _id: channelId, 
    interpreter: userId
  });
};

Views.isInChannel = function(channelId, userId) {
  var channel = _.findWhere(app.room.get('channels'), {_id: channelId });
  if (_.isUndefined(channel.users)) {
    return false;
  } else {
    return _.contains(channel.users, userId);
  }
};

Views.isInQueue = function(userId) {
  return  _.chain(app.room.get('handsQueue'))
      .map(function(user){return user._id; })
      .contains(userId)
      .value();
};

Views.isCalledOn = function(userId) {
  var whoIsCalledOn = app.room.get('calledon');
  if (!whoIsCalledOn) {
    // case where no one is called on and calledon object is empty or undefined
    return false;
  } else {
    return whoIsCalledOn._id == userId;
  }
};

/**
 * Render Participants Helper Functions
 */

Views.util.participants = {};

Views.util.participants.moderator = function(user) {
  // If room is moderated
  if( app.room.get('isModerated') ) {
    // Add moderator indicator to row of moderator
    if(Views.isModerator( user._id )) {
      var moderatorInfoEl = $('#' + user._id + ' .is-moderator');
      var moderatorInfoHtml = '<span class="moderator" data-toggle="tooltip" title="Moderator"><i class="icon"></i></span>';
      $(moderatorInfoEl).append(moderatorInfoHtml);
    }
  }
};

Views.util.participants.channelInfo  = function(user) {
  var inAChannel = Views.isInAChannel( user._id );
  if(inAChannel) {
    var channelInfoEl = $('#' + user._id + ' .is-in-channel');
    var channelInfoHtml = '<span class="language" data-toggle="tooltip" title="' + inAChannel + '"<i class="icon"></i>' + inAChannel + '</span>';
    $(channelInfoEl).append(channelInfoHtml);
  }
}; 

Views.util.participants.moderatorControls = function(user) {
  // If room is moderated
  if( app.room.get('isModerated') ) {
    // If current user is moderator, add moderator controls to all but own row
    if(Views.isModerator( app.user.id )) {
      var moderatorControlsEl = $('#' + user._id + ' .moderator-controls');
      var muteControlsEl = $('#' + user._id + ' .mute-controls');
      new Views.ModeratorControls({ el: moderatorControlsEl }).render(user._id);
      new Views.MuteControls({ el: muteControlsEl }).render(user._id);
    }
  }
};

Views.util.participants.userControls = function(user) {
  // Add current user controls to row of current user
  if(Views.isCurrentUser( user._id )) {
    var currentUserEl = $('#' + user._id + ' .current-user-controls');
    var muteControlsEl = $('#' + user._id + ' .mute-controls');
    // If room is moderated
    if( app.room.attributes.isModerated ) {
      new Views.CurrentUserControls({ el: currentUserEl }).render(user._id);
    }
    new Views.MuteControls({ el: muteControlsEl }).render(user._id);
  }
};

Views.util.participants.queueDisplay = function(user) {
  // If room is moderated
  if( app.room.get('isModerated') ) {
    var positionZeroIndexed= _.findIndex(app.room.get('handsQueue'), function(userInQueue){
      return user._id == userInQueue._id;
    });
    
    if (positionZeroIndexed !== -1) {
      var queuePosition = (positionZeroIndexed + 1).toString();
      var queueInfoEl = $('#' + user._id + ' .is-queued');
      var queueInfoHtml = '<span class="queued" data-toggle="tooltip" title="Queued">' + queuePosition + '</span>';
      $(queueInfoEl).append(queueInfoHtml);
    }
  }
};
