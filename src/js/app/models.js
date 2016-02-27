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
    url: '/room/id/' + roomId + '/callon',
    data: {
      _id: personCalledOnId
    }
  });
};

/**
 * Interpretation Rules
 *
 * Interpret
 *   When user opts to become interpreter
 *   - She is added to the channel's users array
 *   - She is added as channel interpreter
 *   - Only Leave button appears
 *   Interpret button appears when channel has no interpreter
 * Hear (Join)
 *   When user opts to become a listener
 *   - She is added to the channel's users array
 *   - Only the Leave button appears
 *   Join button appears when user is not already in the channel (as 
 *   listener or interpreter)
 * Main (Leave)
 *   Leave button appears when user is in the channel
 *
 */

Models.User = Backbone.Model.extend({
  idAttribute: "_id",
  urlRoot: "/users",
  raiseHand: function() {
    var roomId = app.room.get('_id');
    Models.raiseHandAjax(roomId).done(function(data){
      // Do something when successful?
      // or show 'raising hand in progress?'
    });
  },
  lowerHand: function() {
    var roomId = app.room.get('_id');
    Models.lowerHandAjax(roomId).done(function(data){
      // 
    });
  },
  callOn: function(personCalledOnId) {
    var roomId = app.room.get('_id');
    Models.callOnAjax(roomId, personCalledOnId).done(function(data){
      // when successful
    });
  },
  callOff: function(personCalledOnId) {

  }
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
  // string, string -> adds user to channel
  addUserToChannel: function(userId, channelId) {
    var that = this;
    var channels = this.get('channels');
    var updatedChannels = _.map(channels, function(channel){
      if (channel._id === channelid) {
        channel.users.push(userId);
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
  },  // string, string -> changes interpreter of channel
  addInterpreterToChannel: function(interpreterId, channelId) {
    var that = this;
    var channels = this.get('channels');
    var updatedChannels = _.map(channels, function(channel){
      if (channel._id === channelId) {
        that.addUserToChannel(interpreterId, channelId);
        channel.interpreter = interpreterId;
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
  // string, string -> removes user from channel
  removeUserFromChannel: function(userId, channelId) {
    var that = this;
    var channels = this.get('channels');
    var updatedChannels = _.map(channels, function(channel){
      if (channel._id === channelid) {
        _.without(channel.users, userId);
        if (channel.interpreter === userId) {
          channel.interpreter = null;
        }
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
  },  // string, string -> changes interpreter of channel
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
    var that = this;
    var roomnum = this.get('roomnum');
    this.socket = io('/' + roomnum);
    this.socket.on('room update', function(room){
      that.set(room);
    });
  }
});

Models.Language = Backbone.Model.extend({});

Models.Languages = Backbone.Collection.extend({
  model: Models.Language,
  url: '/js/languages.json',

  parse: function(response){
      return response;
  }
});

Models.util.audio.dtmf = function (cur_call, key) {
  if(cur_call) {
    var ret = cur_call.dtmf(key);
    return true;
  } else {
    console.error('error joining conference');
    return false;
  }
};


// there are 3 custom events on this model that can be listened to: 'connecting', 'active', 'hangup'
Models.Audio = Backbone.Model.extend({
  verto: null,
  cur_call: null,
  defaults: {
    "conf": null,
    "my_key": null,
    verto_call_callbacks: null
  },
  initialize: function() {
    this.set('conf', app.room.get('roomnum'));
    this.set('name', app.user.get('username'));
    this.setCallbacks(_.noop, _.noop, _.noop);
  },
  login: function() { 
    this.verto = new $.verto({
      login: config.impi,
      passwd: config.password,
      socketUrl: config.websocket_proxy_url,
      tag: "audio-remote",
      videoParams: {},
      audioParams: {
        googAutoGainControl: false,
        googNoiseSuppression: false,
        googHighpassFilter: false
      },
      iceServers: true
    }, {});
  },
  call_init: function() {
    var conf = this.get("conf");
    var name = this.get("name");
    var callbacksObj = this.get("verto_call_callbacks");
    
    if(this.cur_call) {
      console.error("There is already a calling going on. Hand up first if you'd like to start another call.");
      return;
    }

    this.cur_call =  this.verto.newCall({
      destination_number: "9999",
      caller_id_name: name,
      caller_id_number: conf,
      useVideo: false,
      useStereo: false
    }, callbacksObj);

    // Specify function to run if the user navigates away from this page.
    $.verto.unloadJobs = [ this.hangup ];
  },
  hangup: function() {
    if(this.cur_call) {
      this.cur_call.hangup();
      // Unset cur_call so when the user tries to re-connect we know to re-connect
      this.cur_call = null;
    }
  },
  // these are functions that will run during their associated phase of the call
  setCallbacks: function(connecting, active, hangup) {
    var that = this;
    var confNum = this.get('conf');
    var verto_call_callbacks = {
      onDialogState: function(d) {
        that.cur_call = d;
        switch (d.state) {
        case $.verto.enum.state.requesting:
          connecting();
          that.trigger('connecting');
          break;
        case $.verto.enum.state.active:
          active();
          that.trigger('active');
          Models.util.audio.dtmf(that.cur_call, confNum + '#');
          // Record what my unique key is so I can reference it when sending special chat messages.
          that.set('my_key', that.cur_call.callID);
          break;
        case $.verto.enum.state.hangup:
          hangup();
          that.trigger('hangup');
          that.hangup();
          break;
        }
      }
    };
    this.set('verto_call_callbacks', verto_call_callbacks);
  },
  // input: "main", "hear", "interpret"
  // output: false or self
  switchChannel: function(option) {
    if (!this.cur_call) {
      console.error('You must start a call before you switch channels.');
      return false;
    }
    if (option === 'main') {
      Models.util.audio.dtmf(this.cur_call, '0');
    } else if (option === 'hear') {
      Models.util.audio.dtmf(this.cur_call, '1');
    } else if (option === 'interpret') {
      Models.util.audio.dtmf(this.cur_call, '2');
    } else {
      console.error('Switch Channel takes these options: "main", "hear", "interpret"');
      return false;
    }
    return this;
  }
 });

