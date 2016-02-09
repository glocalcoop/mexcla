Models.User = Backbone.Model.extend({
  idAttribute: "_id",
  urlRoot: "/users"
});

Models.Room = Backbone.Model.extend({
  idAttribute: "_id",
  urlRoot: "/room/id",
  initialize: function() {
    this.establishSocket();
  }, 
  fetchByNum: function() {
    var that = this;
    $.ajax({
      type: 'GET',
      url: '/room/' + this.attributes.roomnum
    }).done(function(room){
      that.set(room);
    });
    return this;
  },
  // channel (object) -> adds new channel to room;
  createChannel: function(channel) {
    var that = this;
    this.createChannelAjax(channel).done(function(res){
      if (that.serverErrorCheck(res)) {
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
  // string, string -> changes interpreter of channel
  addInterpreterToChannel: function(interpreter, channelid) {
    var that = this;
    var channels = this.get('channels');
    var updatedChannels = _.map(channels, function(channel){
      if (channel._id === channelid) {
        channel.interpreter = interpreter;
        that.updateChannelAjax(channel).done(function(channel){
          // callback...could check for errors here
          // console.log(channel);
        });
        return channel;
      } else {
        return channel;
      }
    });
    this.set('channels', updatedChannels); // updated before server...should eventually ensure it is saved to the db
    return this;
  },
  // given a channel (object) it updates the db/server with any of the changed priorities
  updateChannelAjax: function(channel) {
    var channelID = channel._id;
    var channelData = _.omit(channel, '_id');
    return $.ajax({
        type: 'POST',
        url: '/room/id/' + this.get('_id') + '/channel/' + channelID + '/update',
        data: channelData
    });
  },
  serverErrorCheck: function(res) {
    if (_.has(res, 'error')) {
      alert(res.error);
      return false;
    } else {
      return true;
    }
  },
  establishSocket: function() {
    var roomnum = this.get('roomnum');
    this.socket = io('/' + roomnum);
    this.socket.on('room update', function(room){
      console.log(room);
    });
  }
});

/*

{
  lang: '' // 'en', 'es'
  users; [{users}]
  interpreter: user,
}


*/

/*
USERS

{
 username: ''
 currentRoom: null or ObjectId
 lang: ''
 admin: boolean
 _id: 
}

ROOM
room-template
room-sidebar-template
{
conference
roomNum
room
mute
unmute
original
interpretation
provide
Notepad 
Spreadsheet
IRC chat
participants

 }



*/
