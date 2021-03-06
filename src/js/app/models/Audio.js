Models.util.audio.dtmf = function (cur_call, key) {
  if(cur_call) {
    var ret = cur_call.dtmf(key);
    return true;
  } else {
    console.error('error joining conference');
    return false;
  }
};

Models.util.audio.onWSLogin = function (verto, success) {
  if (success) {
    this.trigger('logged_in');
  }
};

/**
 * 
 * @param {string} roomNum
 * @param {string} action - update, speakon, speakoff
 */
Models.util.audio.freeswitchAction = function(roomNum, action) {
  $.ajax({
    type: 'GET',
    url: config.controller_url + /conf/ + roomNum + '/' + action
  }).done(function(res){});
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
    this.login();
    this.listenTo(app.room, 'change:users', this.muteFromAfar);
    this.setUpFreeswitchClient();
    this.roomAudioEvents();
  },
  login: function() {
    
    // this prevents verto from re-connecting audio upon browser refresh.
    localStorage.removeItem("verto_session_uuid");
    
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
    },{ 
      onWSLogin: _.bind(Models.util.audio.onWSLogin, this)
    });
  },
  call_init: function(status) {
    var conf = this.get("conf");
    var userName = this.get("name");
    var userId = app.user.id;
    var callbacksObj = this.get("verto_call_callbacks");
    var caller_id_number = (_.isUndefined(status)) ? app.user.getStatus() : status;
    
    if(this.cur_call) {
      console.error("There is already a calling going on. Hand up first if you'd like to start another call.");
      return;
    }
    this.cur_call =  this.verto.newCall({
      destination_number: conf.toString(),
      caller_id_name: app.user.get('username'),
      caller_id_number: caller_id_number,
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
          that.trigger('status', 'connecting');
          break;
        case $.verto.enum.state.active:
          active();
          // Models.util.audio.dtmf(that.cur_call, confNum + '#');
          // Record what my unique key is so I can reference it when sending special chat messages.
          that.set('my_key', that.cur_call.callID);
          that.trigger('status', 'active');
          break;
        case $.verto.enum.state.hangup:
          hangup();
          that.hangup();
          that.trigger('status', 'hangup');
          break;
        }
      }
    };
    this.set('verto_call_callbacks', verto_call_callbacks);
  },
  /**
   * input: "main", "hear", "interpret"
   * output: false or self
   */
  switchChannel: function(status) {
    console.log(status);
    if (_.isUndefined(status)) {
      status = 'main';
    }
    
    if (!this.cur_call) {
      console.error('You must start a call before you switch channels.');
      return false;
    }
    this.hangup();
    this.call_init(status);
    return this;
  },
  /**
   * Toggles between interpret speak state
   * @param {String} action - 'on' or 'off'
   */
  interpretSpeak: function(action) {
    if (action === 'on' || action === 'off') {
      Models.util.audio.freeswitchAction(app.room.get('roomnum'), 'speak' + action);
    } else {
      console.error('action must be either "on" or "off"');
    }
  },
  /**
   * @param "mute", "unmute", "status"
   * @return {boolean}
   * This is another way of muting. It's nicer that dialing '*' because you can find out if you are already muted or not...
   * we should investigate if there is a difference between these to options!'
   */
  mute: function(option) {
      if (!this.cur_call) {
        console.error('You must start a call before you mute yourself.');
        return false;
      }
      if (option === 'mute') {
        console.log('muted');
        return this.cur_call.setMute('off');
      } else if (option === 'unmute') {
        console.log('unmuted');
        return this.cur_call.setMute('on');
      } else if (option === 'status'){
        return this.cur_call.setMute();
      } else {
        console.error('Mute user takes these options: "mute", "unmute", "status"');
        return false;
      }
  },
  /**
   * @param "mute", "unmute"
   * @return false or self
   */
  muteAudio: function(option) {
    if (!this.cur_call) {
      console.error('You must start a call before you mute yourself.');
      return false;
    }
    if (option === 'mute') {
      Models.util.audio.dtmf(this.cur_call, '*');
    } else if (option === 'unmute') {
      Models.util.audio.dtmf(this.cur_call, '*');
    } else {
      console.error('Mute user takes these options: "mute", "unmute"');
      return false;
    }
    return this;
  },
  /**
   * When the moderator updates who is muted in a channel, this function will mute the participant 
   * TODO: this will run every time there is a change to the user array. We should modify it so that it only runs when there is a change to a specific user.
   */
  muteFromAfar: function() {
    var userid = app.user.get('_id');
    if (app.room.isUserMuted(userid)) {
      if (!this.mute('status')) {
        this.mute('mute');
      }
    } else {
      if (this.mute('status')) {
        this.mute('unmute');
      }
    }
  },
  roomAudioEvents: function() {
    this.listenTo(app.room, 'switchChannel', this.switchChannel);
    // this.listenTo(app.room, 'joinChannel', this.switchChannel);
    // this.listenTo(app.room, 'leaveChannel', this.switchChannel);
    // this.listenTo(app.room, 'becomeInterpreter', this.switchChannel);
  },
  setFloor: function() {},
  setMute: function() {},
  setUpFreeswitchClient: function() {
    this.listenTo(this,'status', this._freeswitchAction);
  },
  _freeswitchAction: function(status) {
    if (status === 'active') {
      Models.util.audio.freeswitchAction(String(this.get('conf')), 'update');
    }
  }
});
