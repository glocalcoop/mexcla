Models.Room = Backbone.Model.extend({
  idAttribute: "_id",
  urlRoot: "/room/id",
  initialize: function() {
    this.establishSocket();
  }, 
  fetchByNum: function() {
    var that = this;
    this.fetchByNumAjax().done(function(room){
        that.set(room);
    });
    return this;
  },
  /**
   * Adds a Channel to the room
   * @param {object} channel
   * @returns {this}
   */
  createChannel: function(channel) {
    var that = this;
    
    this.createChannelAjax(channel).done(function(res){
      if (Models.util.room.serverErrorCheck(res)) {
        that.set(res);
      }
    });
    return this;
  },
  createChannelAjax: function(channel) {
    return $.ajax({
      type: 'POST',
      url: '/room/id/' + this.get('_id') + '/channel/create',
      data: channel
    });
  },
  fetchByNumAjax: function() {
    return $.ajax({
      type: 'GET',
      url: '/room/' + this.get('roomnum')
    });
  },
  /**
   * Changes Interpreter of the Channel
   * @param {string} userId
   * @param {string} channelId
   */
  becomeInterpreter: function(userId, channelId) {
    this.trigger('switchChannel', 'interpret', channelId);
    Models.updateChannelAjax('interpret', this.get('_id'), channelId, userId).done(function(data){
      //
    });
  },
  /**
   * Removes user from channel
   * @param {string} userId
   * @param {string} channelId
   */
  leaveChannel: function(userId, channelId) {
    this.trigger('switchChannel', 'main', channelId);
    Models.updateChannelAjax('leave', this.get('_id'), channelId, userId).done(function(data){
      //
    });
  },
  /**
   * Adds user to a channel
   * @param {string} userId
   * @param {string} channelId
   */
  joinChannel: function(userId, channelId) {
    this.trigger('switchChannel', 'hear', channelId);
    Models.updateChannelAjax('join', this.get('_id'), channelId, userId).done(function(data){
      //
    });
  },
  /**
   * Mutes a user
   * Does two things:
   * 1. Mutes user's audio
   * 2. Updates isMuted field for user on server.
   * @param {string} - userid
   */
  mute: function(userid) {
    if (this.isUserMuted(userid)) {
      // user is muted, so unmute:
      Models.muteAjax('unmute', this.get('_id'), userid);
      // if the user muted is the current user, unmute their audio
      if (userid === app.user.get('_id')) {
        app.audio.mute('unmute');
      }
    } else {
      Models.muteAjax('mute', this.get('_id'), userid);
      // if is the current user, mute their audio
      if (userid === app.user.get('_id')) {
        app.audio.mute('mute');
      }
    }
     console.log('mute called: ' + userid);
  },
  /**
   * Reveals if user is muted or not
   * @param {string} userid
   * @returns {boolean}
   */
  isUserMuted: function(userid) {
    var user = Models.util.room.userById(this.get('users'), userid);
    return user.isMuted;
  },
  establishSocket: function() {
    var that = this;
    var roomnum = this.get('roomnum');
    this.socket = io('/' + roomnum);
    this.socket.on('room update', function(room){
      that.set(room);
    });
  }
});


