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
    this.verto.hangup();
    this.trigger('logged_in');
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
    this.setCallbacks(_.noop, _.bind(this.joinLeaveEventsOn, this), _.bind(this.joinLeaveEventsOff, this));
    this.login();
    this.listenTo(app.room, 'change:users', this.muteFromAfar);
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
    },{ 
      onWSLogin: _.bind(Models.util.audio.onWSLogin, this)
    });
  },
  call_init: function() {
    var conf = this.get("conf");
    var userName = this.get("name");
    var userId = app.user.id;
    var callbacksObj = this.get("verto_call_callbacks");
    
    if(this.cur_call) {
      console.error("There is already a calling going on. Hand up first if you'd like to start another call.");
      return;
    }
'' +
    this.cur_call =  this.verto.newCall({
      destination_number: conf.toString(),
      caller_id_name: userName,
      caller_id_number: userId,
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
          Models.util.audio.dtmf(that.cur_call, confNum + '#');
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
  switchChannel: function(option, channelId) {
    console.log(channelId);
    if (!this.cur_call) {
      console.error('You must start a call before you switch channels.');
      return false;
    }
    if (option === 'main') {
      console.log('dtmf: 0');
      Models.util.audio.dtmf(this.cur_call, '0');
    } else if (option === 'hear') {
      console.log('dtmf: 1');
      Models.util.audio.dtmf(this.cur_call, '1');
    } else if (option === 'interpret') {
      console.log('dtmf: 2');
      Models.util.audio.dtmf(this.cur_call, '2');
    } else {
      console.error('Switch Channel takes these options: "main", "hear", "interpret"');
      return false;
    }
    return this;
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
  joinLeaveEventsOn: function() {
    if (app.user.isInAChannel()) {
      this.switchChannel('hear');
    }
    this.listenTo(app.room, 'joinChannel', this.switchChannel);
    this.listenTo(app.room, 'leaveChannel', this.switchChannel);
    this.listenTo(app.room, 'becomeInterpreter', this.switchChannel);
  },
  joinLeaveEventsOff: function() {
    this.stopListening(app.room);
  },
  
  /**
   * API Ref: https://freeswitch.org/confluence/display/FREESWITCH/mod_conference#mod_conference-APIReference
    * Can we set user as `moderator` if they are moderator?
    * `mute`, `unmute`
      * `dtmf` Send DTMF to any member of the conference `conference <confname> dtmf <member_id>|all|last|non_moderator <digits>`
      * `mute` Mutes a conference member `conference <confname> mute <member_id>|all|last|non_moderator [quiet]`
      * `unmute` Unmute a conference member  `conference <confname> unmute <member_id>|all|last|non_moderator [quiet]`
    * Is our call-on the same as `floor`?
      * `floor` Toggle floor status of the member. `conference <confname> <member_id>|all|last|non_moderator `
    * Settable Variables: https://freeswitch.org/confluence/display/FREESWITCH/mod_conference#mod_conference-SettableChannelVariables
      * `conference_flags` and `conference_member_flags`

     * evoluxbr.github.io/verto-docs
   */
  setFloor: function() {},
  setMute: function() {}
  
});
