var app = {};

/** @namespace */
var Views = {};
Views.util = {};

/** @namespace */
var Models = {};
Models.util = {};
Models.util.audio = {};

var config = {
  realm: 'freeswitch.ziggy.space',
  impi: 'guest', 
  password: 'mexcla',
  websocket_proxy_url: 'wss://freeswitch.ziggy.space:8082'
};


var websiteText = {
    en: {
      title: "Simultaneous Interpretation Conference System",
      welcome: "Welcome to Mexcla",
      subhead: "Mexcla is the Simultaneous Interpretation Conference System",
      salutation: "Hi",
      register: "Please Register",
      username: "Enter Name",
      your_name: "Your Name",
      select_language: "Select Your Language",
      enter_button: "Enter",
      connect: "Connect",
      connecting: "Connecting",
      disconnect: "Disconnect",
      conference: "Conference",
      link: "Link",
      original: "Hear Original Language",
      interpretation: "Hear Interpretation",
      provide: "Provide Interpretation",
      participants: "Participant List",
      room: "Room",
      join: "Join a Room",
      enter: "Please Enter the Room Number",
      create: "Create a Room",
      room_options: "Room Options",
      private_room: "Private Room",
      moderated_room: "Moderated Room",
      notepad: "Notepad",
      spreadsheet: "Spreadsheet",
      chat: "Chat",
      channels: "Language Channels",
      add_channel: "Add a Channel",
      channel_language: "Channel Language",
      channel_abbreviation: "Language Abbreviation",
      interpret: "Interpret",
      join_channel: "Join",
      leave_channel: "Leave",
      moderator: "Moderator",
      queued: "Queued",
      mute: "Mute",
      unmute: "Unmute",
      raise_hand: "Raise Hand",
      lower_hand: "Lower Hand",
      click_copy: "Click to Copy"
    },
    es: {
      title: "Sistema de Conferencia Interpretación Simultánea",
      welcome: "Bienvenido a Mexcla",
      subhead: "Mexcla es el Sistema de Conferencia Interpretación Simultánea",
      salutation: "Hola",
      register: "Please Register [es]",
      username: "Ingrese su Nombre",
      your_name: "Su Nombre",
      select_language: "Select Your Language [es]",
      enter_button: "Ingrese",
      connect: "Connectarse",
      connecting: "Connecting [es]",
      disconnect: "Disconnect [es]",
      conference: "Sala De Conferencias",
      link: "Hipervínculo",
      original: "Escuchar en Idioma Original",
      interpretation: "Escuchar la interpretación",
      provide: "Proporcionar interpretación",
      participants: "Lista de Participantes",
      room: "Sala",
      join: "Entrar en una Sala",
      enter: "Por Favor, Ingrese el Número de la Habitación",
      create: "Crear una Sala",
      room_options: "Room Options [es]",
      private_room: "Private Room [es]",
      moderated_room: "Moderated Room [es]",
      notepad: "Añadir Notas",
      spreadsheet: "Spreadsheet [es]",
      chat: "Añadir el Chat",
      channels: "Language Channels [es]",
      add_channel: "Add a Channel [es]",
      channel_language: "Channel Language [es]",
      channel_abbreviation: "Language Abbreviation [es]",
      interpret: "Interpret [es]",
      join_channel: "Join [es]",
      leave_channel: "Leave [es]",
      moderator: "Moderator [es]",
      queued: "Queued [es]",
      mute: "Mícrófono Innactivo",
      unmute: "Activar Micrófono",
      raise_hand: "Raise Hand [es]",
      lower_hand: "Lower Hand [es]",
      click_copy: "Copia"

    }
};

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

Models.Language = Backbone.Model.extend({});

Models.Languages = Backbone.Collection.extend({
  model: Models.Language,
  url: '/js/languages.json',

  parse: function(response){
    return response;
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
    this.trigger('becomeInterpreter', 'interpret', channelId);
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
    this.trigger('leaveChannel', 'main', channelId);
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
    this.trigger('joinChannel', 'hear', channelId);
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
    var roomId = app.room.get('_id');
    Models.callOffAjax(roomId, personCalledOnId).done(function(data){
      // when successful
    });
  },
  isInAChannel: function() {
    var userId = this.get('_id');
    var channel = _.find(app.room.get('channels'), function(channel){
      return _.contains(channel.users, userId);
    });
    return (_.isUndefined(channel)) ? false : channel.lang;
  },
  /**
   * Is a user the interpreter of the given language channel?
   * @param {string} lang
   * @returns {boolean} 
   */
  isInterpreter: function(lang) {
    var channel = _.find(app.room.get('channels'), function(channel){
      return channel.lang === lang;
    });
    return (channel.interpreter === this.get('_id'));
  },
  /**
   * Returns user status: 'main', 'interpret', 'hear'
   * @return {string}
   */
  getStatus: function(){
    var userChannelLang = this.isInAChannel();
    if (userChannelLang) {
      if (this.isInterpreter(userChannelLang)) {
        return 'interpret';
      } else {
        return 'hear';
      }
    } else {
      return 'main';
    }
  }
});

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

/**
 * Audio Connect
 * use: new Views.ConnectAudio({model: app.audio})
 */
Views.ConnectAudio = Backbone.View.extend({
  template: '',
  el: $('#connect-button'),
  initialize: function(userId) {
    this.render(userId);
    this.listenTo(this.model, 'status', this.updateCallStatus);
  },
  render: function() {
    this.connectAudio();
  },
  updateCallStatus: function(status){
    switch(status) {
    case 'connecting':
      $('#connect-button').addClass('connecting');
      $('#connect-button').html(websiteText[app.user.get('lang')].connecting + ' <i class="icon"></i>');
      break;
    case 'active':
      /**
       * Conditions: user is in the process of being connected
       * On connection:
       *   User should be connected to audio
       *   Connecting button should be replaced by Disconnect button
       */
      $('#connect-button').removeClass('connecting');
      $('#connect-button').addClass('connected');
      $('#connect-button').html(websiteText[app.user.get('lang')].disconnect + ' <i class="icon"></i>');
      break;
    case 'hangup':
      /**
       *  On disconnection:
       *  Disconnect button should be replaced by Connect button
       */
      $('#connect-button').removeClass('connected');
      $('#connect-button').html(websiteText[app.user.get('lang')].connect + ' <i class="icon"></i>');
      break;
    }
  },
  connectAudio: function() {
    var that = this;
    $('#connect-button').click(function(event) {
      event.preventDefault();
      var text = websiteText[app.user.get('lang')];
      var currCall = (null != that.model.cur_call) ? that.model.cur_call : null;
      /**
       * Conditions: user is registered, in room and not connected
       * On click:
       *   Audio connection should be initiated
       *   Connect button should be replaced by Connecting button
       */
      if(!currCall) {
        // Call not active
        if (!that.model.verto) {
          that.model.login();
          that.updateCallStatus('connecting');
          that.model.on('logged_in', function(){
            that.model.call_init();
            });
        } else {
          that.updateCallStatus('connecting');
          that.model.call_init();
        } 
      }
      else {
        /**
         * Conditions: user is connected to audio
         * On click:
         *   Audio connection hangup should be initiated
         */
        that.model.hangup();
       }
    });
  }
});


/**
 * Channel
 * @class 
 */
Views.Channel = Backbone.View.extend({
  template: _.template($('#channel-row-template').html()),
  
  /**
   * Render
   * @memberOf Views.Channel#
   * @param {}
   * @returns {this} 
   */
  render: function(channel) {
    var data = {
      text: websiteText[app.user.attributes.lang],
      channel: channel
    };
    this.$el.append(this.template(data));
    /**
     * Moderator can't be interpreter
     * Moderator can't join a channel
     */
    if( !Views.isModerator(app.user.id) ) {
      this.renderControls(data);
    }
    
    return this;
  },
  /**
   * Renders the controls for each channel
   * @param {Object} data - Contains channel and other information for template rendering
   * @param {Object} data.channel
   * @returns {this} 
   */
  renderControls: function(data) {
    if(!Views.hasChannelInterpreter(data.channel._id)) {
      this.becomeInterpreter(data);
    }
    
    if(Views.isInChannel(data.channel._id, app.user.id)) {
      this.leaveChannel(data);
    } else {
      this.joinChannel(data);
    }
    
    return this;
  },
  becomeInterpreter: function(data) {
    var interpretControlsEl = '.interpret-controls';
    new Views.ChannelInterpretControls({ el: interpretControlsEl }).render(data);
    $('#channels .interpret').click(function(event) {
      event.preventDefault();
      app.room.becomeInterpreter(app.user.id, data.channel._id);
    });
  },
  joinChannel: function(data) {
    var joinControlsEl = '.join-controls';
    new Views.ChannelJoinControls({ el: joinControlsEl }).render(data);
    $('#channels .join').click(function(event) {
      event.preventDefault();
      app.room.joinChannel(app.user.id, data.channel._id);
    });
  },
  leaveChannel: function(data) {
    var leaveControlsEl = '.leave-controls';
    new Views.ChannelLeaveControls({ el: leaveControlsEl }).render(data);
    $('#channels .leave').click(function(event) {
      event.preventDefault();
      app.room.leaveChannel(app.user.id, data.channel._id);
    });
  }
});

/**
 * Creates Add Channel Button
 */

Views.AddChannelButton = Backbone.View.extend({
  template: _.template($('#add-channel-button-template').html()),
  el: '#add-channel-button-container',
  render: function(templateData) {
    this.$el.html(this.template(templateData));
    this.$el.find('#add-channel-button').click(function(){
      if( app.room.get('channels').length < 1 ) {
        new Views.AddChannelModal({model: app.room}).render();
      }
      else {
        $(this).prop('disabled', true);
      }
    });
  }
});

/**
 * Participant Info and Controls
 */
Views.ModeratorControls = Backbone.View.extend({
  template: _.template($('#moderator-controls-template').html()),
  render: function(userId) {
    // reset 
    this.$el.html('');
    // only show if in queue or is called on
    if(Views.isInQueue(userId) || Views.isCalledOn(userId)){
      this.$el.html(this.template({}));
      this.callOnClick(userId);
      this.ensureCorrectTogglePosition(userId);
    }
    return this;
  },
  callOnClick: function(userId) {
    $('#' + userId).find('button.call-on').click(function(e){
      if (Views.isCalledOn(userId)) {
        app.user.callOff(userId);
      } else {
        app.user.callOn(userId);
      }
    });
  },
  ensureCorrectTogglePosition: function(userId) {
    if (Views.isCalledOn(userId)) {
      $('#' + userId).find('button.call-on').addClass('on');
    } else {
      $('#' + userId).find('button.call-on').removeClass('on');
    }
  }
  
});

/**
 * Current User Controls
 */
Views.CurrentUserControls = Backbone.View.extend({
  // Might need to change to use class, if not unique on page
  // el: $('.current-user-control');
  template: _.template($('#current-user-controls-template').html()),
  render: function(userId) {
    this.$el.html(this.template({}));
    this.raiseHandToggle(userId);
    this.raiseHandClick(userId);
  },
  raiseHandToggle: function(userId) {
    if (Views.isInQueue(userId)){
      $('#' + userId).find('button.raise-hand').addClass('on');
    } else {
      $('#' + userId).find('button.raise-hand').removeClass('on');
    }
  },
  raiseHandClick: function(userId) {
    $('#' + userId + ' .current-user-controls .raise-hand').click(function(e){
      if (Views.isInQueue(userId)) {
        app.user.lowerHand();
      } else {
        app.user.raiseHand();
      }
    });
  }
});

/**
 * Mute Controls
 */
Views.MuteControls = Backbone.View.extend({
  template: _.template($('#mute-controls-template').html()),
  render: function(userid) {
    this.userid = userid;
    this.$el.html(this.template({}));
    this.muteToggle(userid);
  },
  muteToggle: function(userid) {
    var that = this;
    var selector = '#' + userid + ' .mute';
    if(app.room.isUserMuted(userid)) {
      $(selector).addClass('muted');
    } else {
      $(selector).removeClass('muted');
    }
    $('#' + userid + ' .mute').click(function(event) {
      event.preventDefault();
      app.room.mute(that.userid);
      $(this).toggleClass('muted');
    });
  }
});


/**
 * Conditions: no interpreter assigned to channel and 
 * user isn't moderator
 * On click:
 *   User should be added to channel users
 *   User should be added as moderator
 *   Interpret button should disappear
 */
Views.ChannelInterpretControls = Backbone.View.extend({
  template: _.template($('#interpret-controls-template').html()),
  render: function(data) {
    this.$el.html(this.template({text: data.text}));
  },
});

/**
 * Conditions: user isn't in channel and user isn't moderator
 * On click:
 *   User should be added to channel users
 *   Join button should disappear
 *   Leave button should appear
 */
Views.ChannelJoinControls = Backbone.View.extend({
  template: _.template($('#join-channel-controls-template').html()),
  render: function(data) {
    this.$el.html(this.template({text: data.text}));
  }
});

/**
 * Conditions: user is in channel
 * On click:
 *   Condition: User is moderator
 *      User should be removed as moderator
 *      User should be removed from channel users
 *      Leave button should disappear
 *      Join button should appear
 *   Condition: User is not moderator
 *      User should be removed from channel users
 *      Leave button should disappear
 *      Join button should appear
 */
Views.ChannelLeaveControls = Backbone.View.extend({
  template: _.template($('#leave-channel-controls-template').html()),
  render: function(data) {
    this.$el.html(this.template({text: data.text}));
  }
});


Views.ChannelTranslatorOptionsList = Backbone.View.extend({
  el: $('#channel-modal #channel-translator-options'),
  template: _.template('<option value="<%= _id %>"><%= username %></option>'),
  initialize: function() {
    this.render();
  },
  render: function(){
    var that = this;
    // TODO: have value be id of user
    var html = '<option value="">Select a Translator</option>';
    html += '<option value="null">None</option>';
    this.$el.html(html);
    
    // Let's use a dynamic list someday
    // var languageList = new Models.Languages();

    // languageList.fetch({
    //   success: function(response) {
    //     var languages = languageList.toJSON();
    //   }
    // });

    var users = this.model.get('users');
    /**
     * Conditions: user must not be moderator
     * Only display users that aren't moderators
     */
    _.each(users, function(user){
       if(!Views.isModerator(app.user.id)) {
         that.$el.append(that.template(user));
       }
    });
  }
});

/**
 * Welcome
 * use: new WelcomeText({model: app.user})
 */
Views.WelcomeText = Backbone.View.extend({
  el: $('#welcome-text'),
  template: _.template($('#welcome-text-template').html()),
  render: function() {
    var lang = (_.isUndefined(this.model.attributes.lang)) ? 'en' : this.model.attributes.lang;
    var welcomeText = {
      greetings: websiteText[lang].salutation + ", ",
      username: (_.isUndefined(this.model.attributes.username)) ? '' : this.model.attributes.username
    };
    this.$el.html(this.template(welcomeText));
    return this;
  },
  initialize: function() {
    this.render();
    // listen to changes to lang and name
    this.listenTo(this.model, 'change:lang', this.render);
    this.listenTo(this.model, 'change:username', this.render);
  }
});

/**
 * Branding
 * use: new WelcomeText({model: app.user})
 */
Views.BrandingText = Backbone.View.extend({
  el: $('#tagline'),
  template: _.template($('#branding-text-template').html()),
  render: function() {
    var lang = (_.isUndefined(this.model.attributes.lang)) ? 'en' : this.model.attributes.lang;
    var brandingText = {
      title: websiteText[lang].title
    };
    this.$el.html(this.template(brandingText ));
    return this;
  },
  initialize: function() {
    this.render();
    // listen to changes to lang and name
    this.listenTo(this.model, 'change:lang', this.render);
    this.listenTo(this.model, 'change:username', this.render);
  }
});


/**
 * IndexView: the main page where a user picks between creating a room or joining an existing one. It renders language according to the user's language property.
 * @class
 */
Views.IndexView = Backbone.View.extend({
  el: '#content',
  template: _.template($("#index-template").html()),
  initialize: function() {
      this.setLang();
      this.listenTo(app.user, 'change:lang', function(){
        this.setLang(); 
        this.render();
      });
      this.render();
  },
  /**
   * @memberof Views.IndexView#
   * @returns {this} 
   */
  render: function () {
    this.$el.html(this.template(websiteText[this.lang]));
    this.switchLang();

    if (Views.util.exists(app.user)) {
      new Views.WelcomeText({model: app.user});
      new Views.BrandingText({model: app.user});
    }

    this.$('#create-new-room-button').click(this.createNewRoomClickHandler());
    this.$('#room-number-button').click(this.roomNumberButtonHandler());
    
    return this;
  },
  /**
   * sets this.lang to be user's lang - uses 'english' as default
   * @memberof Views.IndexView#
   */
  setLang: function() {
    this.lang = (_.isUndefined(app.user.get('lang'))) ? 'en' : app.user.get('lang');
  },
  /**
   * @memberof Views.IndexView# 
   */
  switchLang: function() {
    $('#language-links a').click(function(event) {
      event.preventDefault();
      app.user.set('lang', $(this).data('lang'));
    });
  },
  /**
   * Fires a createRoom ajax request and then navigates to room when the call returns
   * @memberof Views.IndexView# 
   * @param {boolean} moderated
   */
  createRoom: function(moderated) {
    Views.createRoomAjax(moderated).done(function(room){
      app.room = new Models.Room(room);
      app.router.navigate('room/' + room.roomnum, {trigger: true});
    }); 
  },
  /**
   * Joins a room based on #room-number
   * @memberof Views.IndexView# 
   * @returns {function} 
   */
  joinRoom: function() {
    var roomnum = $('#room-number').val();
    return function() {
      app.router.navigate('room/' + roomnum, {trigger: true});
    };
  },
  /**
   * If there is a log-in user, this calls createRoom. Otherwise, it renders the registerModal and passes it a wrapped version of createRoom
   * @private
   * @returns {function}
   */
  createNewRoomClickHandler: function() {
    var that = this;
    return function(e){
      var moderationChecked = $('#moderation-option').is(":checked");
      if (Views.isThereAUser()) {
        that.createRoom(moderationChecked);
      } else {
        var wrappedCreateRoom = _.wrap(that.createRoom, function(func){
          func(moderationChecked);
        });
        new Views.RegisterModal().render(wrappedCreateRoom);
      }
    };
  },
  /**
   * If there's a user, it joins the room, otherwise, it launches the RegisterModal and then joins the room.
   * @private
   * @returns {function}
   */
  roomNumberButtonHandler: function(){
    var that = this;
    return function(e){
      if (Views.isThereAUser()) {
        that.joinRoom()();
      } else {
        new Views.RegisterModal().render(that.joinRoom());
      }
    };
  }
});

/**
 * Add Channel Modal
 * use: new Views.AddChannelModal({model: app.room})
 */
Views.AddChannelModal = Backbone.View.extend({
  template: _.template($('#add-channel-modal-template').html()),
  el: '#add-channel-modal-container',
  render: function(model) {
    this.$el.html(this.template());
    new Views.ChannelTranslatorOptionsList({model: app.room});
    $('#channel-modal').modal("show");
    $('#channel-submit-button').click(function(e){
      var lang = $('#channel-lang-select').val();
      var interpreter = $('#channel-translator-options').val();
      var name = $('#channel-name').val();
      app.room.createChannel({
        'name': name,
        'lang': lang, 
        'interpreter': interpreter,
        'users': []
      });
    });
  }
});

/**
 * Register
 */
Views.RegisterModal = Backbone.View.extend({
  initialize: function() {},
  /**
   * @param {function} afterwards - callback to be executed after user is created.
   */
  render: function(afterwards) {
    $('#register-modal').modal("show");
    $('#register-submit-button').click(function(){
      var username = $('#register-modal #user-name').val();
      var lang = $('#register-modal  #lang-select').val();
      Views.createUserAjax(username, lang).done(function(user){
        app.user.set(user);
        $('#register-modal').hide();
        afterwards();
      });
    });
  }
});


/**
 * Room
 * use: new Views.Room({model: app.room})
 */
Views.Room = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#room-template').html()),
  render: function() {
    var templateData =  _.clone(websiteText[app.user.get('lang')]);
    templateData.roomnum = this.model.get('roomnum');
    this.$el.html(this.template(templateData));
    this.welcomeText();
    this.brandingText();
    this.connect.render();
    this.sidebar.render();
    return this;
  },
  initialize: function() {
    this.lang = app.user.get('lang');
    this.listenTo(app.user, 'change:lang', function(){
      this.lang = app.user.get('lang');
      this.render();
    });
    this.connect = new Views.ConnectAudio({model: app.audio});
    this.sidebar = new Views.RoomSidebar({model: this.model});
    //this.listenTo(this.model, 'change:channels', this.renderChannel);
  },
  welcomeText: function() {
    if (!_.isUndefined(app.user)) {
      new Views.WelcomeText({model: app.user});
    }
  },
  brandingText: function() {
    if (!_.isUndefined(app.user)) {
      new Views.BrandingText({model: app.user});
    }
  },
  switchLang: function() {
    $('#language-links').on('click', 'a', function(event) {
      event.preventDefault();
      app.user.set('lang', $(this).data('lang'));
    });
  }
});

/**
 * Room Sidebar
 * unlike the other Views, this one is appended to #content instead of replacing it
 * use: new Views.RoomSidebar({model: app.room});
 */
Views.RoomSidebar = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#room-sidebar-template').html()),
  initialize: function() {
    this.listenTo(this.model, "change:users", this.renderParticipants);
    this.listenTo(this.model, "change:handsQueue", this.renderParticipants);
    this.listenTo(this.model, "change:channels", this.renderChannels);
    this.listenTo(this.model, "change:channels", this.renderParticipants);
  },
  render: function() {
    var templateData =  _.clone(websiteText[app.user.get('lang')]);
    templateData.roomnum = this.model.get('roomnum');
    templateData.roomLink = $(location).attr('href');
    this.$el.append(this.template(templateData));
    this.renderParticipants();
    this.renderChannels();
    new Views.AddChannelButton().render(templateData);
    return this;
  },
  renderParticipants: function() {
    var that = this;
    var selector = '#participants';
    $(selector).html('');
    _.each(this.model.attributes.users, function(user){
      var participantRow = _.template($('#participant-row-template').html());
      $(selector).append(participantRow(user));
      Views.util.participants.moderator(user);
      Views.util.participants.channelInfo(user);
      Views.util.participants.moderatorControls(user);
      Views.util.participants.userControls(user);
      Views.util.participants.queueDisplay(user);
    }); // end of each loop
    return this;
  },
  renderChannels: function() {
    var channels = this.model.get('channels');
    var channelsEl = '#channels';
    $(channelsEl).empty();
    _.each(channels, function(channel){
        // display channel
        new Views.Channel({ el: channelsEl }).render(channel);
      });
    return this;
  }
});

/**
 * Create User Ajax
 * @param {string} username
 * @param {string} lang
 * @returns {jqXHR}
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
 * @param {boolean} moderated
 * @returns {jqXHR} 
 */
Views.createRoomAjax = function(moderated) {
  return $.ajax({
    type: 'GET',
    url: '/room/create',
    data: {'moderated': moderated}
  });
};

/**
 * Returns true if item is not undefined or null
 */
Views.util.exists = function(x) {
  return !(_.isUndefined(x) || _.isNull(x));
};


/**
 * Checks if there is an 'id' cookie
 * @returns {boolean} 
 */
Views.isThereAUser = function() {
  return (!_.isUndefined(Cookies.get('id')));
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


/**
 * Returns true if channel already has an interpreter
 * @param {string} channelId
 * @returns {Boolean} 
 */
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


var MexclaRouter = Backbone.Router.extend({
  routes: {
    "": "index",
    "room/:roomnum": "room",
    "*page": "default"
  },
  index: function() {
   this.syncUser();
    // log in to homepage
    app.homepage = new Views.IndexView();
  },
  room: function(roomnum) {
    this.syncUser();
    var roomNumAsInt = parseInt(roomnum, 10);
    if (!this.isLoggedIn()) {
      var wrappedGoToRoom = _.wrap(this.goToRoom, function(func){
        func(roomNumAsInt);
      });
      new Views.RegisterModal().render(wrappedGoToRoom);
    } else {
      this.goToRoom(roomNumAsInt);
    }
  },
  default: function() {
    // this route will be executed if no other route is matched.
  },
  goToRoom: function(roomNumAsInt) {
    if (_.isUndefined(app.room) || app.room.get('roomnum') !==  roomNumAsInt) {
      app.room = new Models.Room({roomnum: roomNumAsInt}).fetchByNum();
    }
    if (!app.audio) {
      app.audio = new Models.Audio();
    }
    app.roomView = new Views.Room({model: app.room}).render();
  },
  // Handles creation of Model.User for a few different scenarios:
  // - If user is not logged in, it sets app.user to be an empty user model.
  // - If the user is logged in, but the user model has not been created, it provides the user model with the ID of the user and fetches the details from the server.
  // If there is a language cookie it updates the user model accordingly.
  syncUser: function() {
    var lang = Cookies.get('lang');
    if (!app.user) {
      app.user = new Models.User();
    }
    if (this.isLoggedIn() && _.isUndefined(app.user.get('_id'))) {
      var userid = Cookies.get('id');
      app.user.set('_id', userid);
      app.user.fetch();
    }
    this.setUserLang();
  },
  isLoggedIn: function() {
    return !_.isUndefined(Cookies.get('id'));
  },
  setUserLang: function() {
    var lang = Cookies.get('lang');
    if (!_.isUndefined(lang)) {
      app.user.set('lang', lang);
    }
  }
});

app.init= function(){
  app.router = new MexclaRouter();
  // app.user = new Models.User();
  app.user = null;
  Backbone.history.start(); // must call this to start router
};

/**
 * UI Functions
 */

$(function() {

    /**
     * Call Mute and Unmute
     */
    $('#mic-mute').change(function() {
        if( $(this).prop('checked') ) {
            mexcla_mic_unmute();

        } else {
            mexcla_mic_mute(); 
        }
     
    });


    /**
     * Collaboration
     * Load collaboration iframes when tab is clicked
     */
    $('#collaboration a[data-toggle="tab"]').click(function(event) {

        event.preventDefault();

        $(this).tab('show');

        var panelId = $(event.target).attr('href');

        var src = $(panelId).attr('data-src');
        // if the iframe hasn't already been loaded once
        if($(panelId + ' iframe').attr('src')=='') {
            $(panelId + ' iframe').attr('src',src);
        }

    });


    /**
     * Activate Bootstrap tooltips
     * This isn't working for dynamic elements
     */
    // $.when.apply($, Views.RoomSidebar).done(function() {
    //     $('[data-toggle="tooltip"]').tooltip();
    // });

    /**
     * Activate Clipboard
     */
    new Clipboard('.copy-link');

    $('.copy-link').click(function() {

        $(this).toggleClass( "cursor-grabbling" );

    });

});

