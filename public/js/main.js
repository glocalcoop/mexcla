var app = {};
var Views = {};
var Models = {};
Models.util = {};
Models.util.audio = {};


var config = {
  realm: 'talk.mayfirst.org', 
  impi: 'public', 
  password: 'public',
  websocket_proxy_url: 'wss://talk.mayfirst.org:8082'
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
      enter: "Enter",
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
      enter: "Ingrese",
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
    Models.util.audio.init();
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
  },
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

Models.util.audio.init = function(){
    app.audio = new Models.Audio();
}


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
}

Views.isCurrentUser = function(userId) {
  return userId == app.user.id;
}

Views.isInAChannel = function(userId) {
    return  _.chain(app.room.get('channels'))
      .map(function(user){return user._id; })
      .contains(userId)
      .value();
}

Views.isInQueue = function(userId) {
  return  _.chain(app.room.get('handsQueue'))
      .map(function(user){return user._id; })
      .contains(userId)
      .value();
}

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
 * Register
 */
Views.RegisterModal = Backbone.View.extend({
  initialize: function() {
  },
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
 * Index
 * View: "main" page where user picks between creating a room or joining an existing one it renders language according to app.user.attributes.lang and re-renders when user model language changes
 */
Views.IndexView = Backbone.View.extend({
  el: $('#content'),
  template: _.template($("#index-template").html()),
  initialize: function() {
      this.setLang();
      this.listenTo(app.user, 'change:lang', function(){
        this.setLang(); 
        this.render();
      });
      this.render();
  },
  render: function () {
    var that = this;
    this.$el.html(this.template(websiteText[this.lang]));
    this.welcomeText();
    this.brandingText();
    this.$('#create-new-room-button').click(function(e){
      var moderationChecked = $('#moderation-option').is(":checked");
      if (Views.isThereAUser()) {
        that.createRoom(moderationChecked);
      } else {
        var wrappedCreateRoom = _.wrap(that.createRoom, function(func){
          func(moderationChecked);
        });
        new Views.RegisterModal().render(wrappedCreateRoom);
      }
    });
    this.$('#room-number-button').click(function(e){
      if (Views.isThereAUser()) {
        /**
         * JoinRoom()() is not a typo
         * JoinRoom @returns a (function)
         */
        that.JoinRoom()();
      } else {
        new Views.RegisterModal().render(that.JoinRoom());
      }
    });
    return this;
  },
  setLang: function() {
    /**
     * Fallback to English if lang is missing
     */
    this.lang = (_.isUndefined(app.user.attributes.lang)) ? 'en' : app.user.attributes.lang;
  },
  createRoom: function(moderated) {
    Views.createRoomAjax(moderated).done(function(room){
      app.room = new Models.Room(room);
      app.router.navigate('room/' + room.roomnum, {trigger: true});
    }); 
  },
  JoinRoom: function() {
    var roomnum = $('#room-number').val();
    return function() {
      app.router.navigate('room/' + roomnum, {trigger: true});
    };
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
 * Room
 * use: new Views.Room({model: app.room})
 */
Views.Room = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#room-template').html()),
  render: function() {
    var templateData = _.extend(websiteText[this.lang], this.model.attributes);
    this.$el.html(this.template(templateData));
    this.welcomeText();
    this.brandingText();
    this.sidebar.render();
    this.connect.render();
    return this;
  },
  initialize: function() {
    this.lang = app.user.attributes.lang;
    this.listenTo(app.user, 'change:lang', function(){
      this.lang = app.user.attributes.lang;
      this.render();
    });
    this.connect = new Views.ConnectAudio({model: this.model});
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
  },
  render: function() {
    this.$el.append(this.template(websiteText[app.user.attributes.lang]));
    this.renderParticipants();
    this.renderChannels();
    return this;
  },
  renderParticipants: function() {
    var that = this;
    var selector = '#participants';
    $(selector).html('');
    _.each(this.model.attributes.users, function(user){
      var participantRow = _.template($('#participant-row-template').html());
      $(selector).append(participantRow(user));

      // If room is moderated
      if( app.room.attributes.isModerated ) {
        // Add moderator indicator to row of moderator
        if(Views.isModerator( user._id )) {
          var moderatorInfoEl = $('#' + user._id + ' .is-moderator');
          var moderatorInfoHtml = '<span class="moderator" data-toggle="tooltip" title="Moderator"><i class="icon"></i></span>';
          $(moderatorInfoEl).append(moderatorInfoHtml);
        }

      }

      // TODO: Add channel indicator to row if in channel
      if(Views.isInAChannel( user._id )) {
        var channelInfoEl = $('#' + user._id + ' .is-in-channel');
        var channelInfoHtml = '<span class="language" data-toggle="tooltip" title="{lang}"><i class="icon"></i>{lang}</span>';
        $(channelInfoEl).append(channelInfoHtml);
      }

       // If room is moderated
      if( app.room.attributes.isModerated ) {
        // If current user is moderator, add moderator controls to all but own row
        if(Views.isModerator( app.user.id )) {
          var moderatorControlsEl = $('#' + user._id + ' .moderator-controls');
          var muteControlsEl = $('#' + user._id + ' .mute-controls');
          new Views.ModeratorControls({ el: moderatorControlsEl }).render(user._id);
          new Views.MuteControls({ el: muteControlsEl }).render(user._id);
        }
      }

      // Add current user controls to row of current user
      if(Views.isCurrentUser( user._id )) {
        var currentUserEl = $('#' + user._id + ' .current-user-controls');
        var muteControlsEl = $('#' + user._id + ' .mute-controls');
        // If room is moderated
        if( app.room.attributes.isModerated ) {
          new Views.CurrentUserControls({ el: currentUserEl }).render(user._id);
          new Views.MuteControls({ el: muteControlsEl }).render(user._id);
        }
      }
      
      // If room is moderated
      if( app.room.attributes.isModerated ) {
        that.queueDisplay(user);
      }

    }); // end of each loop
    return this;
  },
  queueDisplay: function(user) {
    var positionZeroIndexed= _.findIndex(app.room.get('handsQueue'), function(userInQueue){
      return user._id == userInQueue._id;
    });
    if (positionZeroIndexed !== -1) {
      var queuePosition = (positionZeroIndexed + 1).toString();
      var queueInfoEl = $('#' + user._id + ' .is-queued');
      var queueInfoHtml = '<span class="queued" data-toggle="tooltip" title="Queued">' + queuePosition + '</span>';
      $(queueInfoEl).append(queueInfoHtml);
    }
    return this;
  },
  
  renderChannels: function() {
    var channels = this.model.get('channels');
    var channelsEl = '#channels';
    //$(channelsEl).html('');

    if (!_.isEmpty(channels)) {
      _.each(channels, function(channel){
        // display channel
        new Views.Channel({ el: channelsEl }).render(channel);
      });
    }
    return this;

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
  // Might need to change to use class, if not unique on page
  // el: $('.mute-controls');
  template: _.template($('#mute-controls-template').html()),
  render: function(userId) {
    this.$el.html(this.template({}));
    this.muteOnUser(userId);
    this.muteOffUser(userId);
  },
  muteOnUser: function(userId) {
    $('#' + userId + ' .mute:not(.on)').click(function(event) {
      app.user.muteOn(userId);
    });
  },
  muteOffUser: function(userId) {
    $('#' + userId + ' .mute.on').click(function(event) {
      console.log($(this));
    });
  }

});

/**
 * Audio Connect
 */
Views.ConnectAudio = Backbone.View.extend({
  template: '',
  // el: $('#connect-icon-and-button');
  initialize: function(userId) {
    this.render(userId);
  },
  render: function(userId) {
    this.connectAudio(userId);
    this.connectingAudio(userId);
    this.disconnectAudio(userId);
  },
  connectAudio: function(userId) {
    $('#connect-button.connect').click(function(event) {
      var connect = new Models.Audio();
      connect.login();
      // Once logged in
      connect.call_init();
      $(this).removeClass('connect').addClass('disconnect');
    });
    /**
     * Conditions: user is registered, in room and not connected
     * On click:
     *   Audio connection should be initiated
     *   Connect button should be replaced by Connecting button
     */
  },
  connectingAudio: function(userId) {
    /**
     * Need to know when connection is complete
     * Can we check?
     * connect.cur_call.gotAnswer
     * connect.cur_call.state.name
     */
    /**
     * Conditions: user is in the process of being connected
     * On connection:
     *   User should be connected to audio
     *   Connecting button should be replaced by Disconnect button
     */
  },
  disconnectAudio: function(userId) {
    $('#connect-button.disconnect').click(function(event) {
      connect.hangup();
      $(this).removeClass('disconnect').addClass('connect');
    });
    /**
     * Conditions: user is connected to audio
     * On click:
     *   Audio connection hangup should be initiated
     * On disconnection:
     *   Disconnect button should be replaced by Connect button
     */
  }
});


/**
 * Channel
 */
Views.Channel = Backbone.View.extend({
  template: _.template($('#channel-row-template').html()),
  render: function(channel) {
    var data = {
      text: websiteText[app.user.attributes.lang],
      data: channel
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
  renderControls: function(data) {
    var interpretControlsEl = $('.interpret-controls');
    var joinControlsEl = $('.join-controls');
    new Views.ChannelInterpretControls({ el: interpretControlsEl }).render(data);
    new Views.ChannelJoinControls({ el: joinControlsEl }).render(data);
  }
});


Views.ChannelInterpretControls = Backbone.View.extend({
  template: _.template($('#interpret-controls-template').html()),
  render: function(data) {
    this.$el.html(this.template({text: data.text}));
  },
  renderInterpret: function(data) {
    /**
     * Conditions: no interpreter assigned to channel and 
     * user isn't moderator
     * On click:
     *   User should be added to channel users
     *   User should be added as moderator
     *   Interpret button should disappear
     */
  },
  renderJoin: function(data) {
    /**
     * Conditions: user isn't in channel and user isn't moderator
     * On click:
     *   User should be added to channel users
     *   Join button should disappear
     *   Leave button should appear
     */
  },
  renderLeave: function(data) {
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
  }
});

Views.ChannelJoinControls = Backbone.View.extend({
  template: _.template($('#join-channel-controls-template').html()),
  render: function(data) {
    this.$el.html(this.template({text: data.text}));
  }
});


// TODO: turn channel html into template
// but for now:
$(document).ready(function(){

  // $('#add-channel-button').click(function(){
  //   new Views.AddChannelModal({
  //     model: app.room
  //   }).render();
  // });

  // Disabled once channel added
  $('#add-channel-button').click(function(){
    if( app.room.get('channels').length < 1 ) {
      new Views.AddChannelModal({
        model: app.room
      }).render();
    }
    else {
      $(this).prop('disabled', true);
    }
  });

});


/**
 * Add Channel Modal
 * use: new Views.AddChannelModal({model: app.room})
 */
Views.AddChannelModal = Backbone.View.extend({
  initialize: function() {
    new Views.ChannelTranslatorOptionsList({model: app.room});
  },
  render: function(model) {
    $('#channel-modal').modal("show");
    $('#channel-submit-button').click(function(e){
      var lang = $('#channel-lang-select').val();
      var interpreter = $('#channel-translator-options').val();
      var name = $('#channel-name').val();
      app.room.createChannel({
        'name': name,
        'lang': lang, 
        'interpreter': interpreter
      });
    });
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
    html += '<option value="none">None</option>';
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
       if(!Views.isModerator(user._id)) {
         that.$el.append(that.template(user));
       }
    });
  }
});


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

app.router = new MexclaRouter();
// app.user = new Models.User();
app.audio = new Models.Audio();
app.user = null;

Backbone.history.start(); // must call this to start router

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
     * Page Language
     * Switch language when language switched
     */
    $('#language-links a').click(function(event) {

        event.preventDefault();
        $('html')[0].lang = $(this).data('lang');

    });


    /**
     * Room Link
     * Add URL to room-link field so it can be copied
     */
    $('#room-link').val( $(location).attr('href') );

    /**
     * Participants
     * Toggle `on` class when participant controls are clicked
     */
    $('#participants').on('click', 'button', function(event) {

        $(this).toggleClass('on');

    });

    /**
     * Channel Controls
     * Toggle Channel Controls
     */
    $('#channels').on('click', 'button.join', function(event) {

        $(this).toggleClass('on');
        $('#channels button.leave').toggleClass('on');
        //$(this).hasClass('on').attr('title', 'Leave Channel').html('Leave');

    });

    $('#channels').on('click', 'button.leave', function(event) {

        $(this).toggleClass('on');
        $('#channels button.join').toggleClass('on');
        //$(this).hasClass('on').attr('title', 'Leave Channel').html('Leave');

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


/**
 * Collaboration Functions
 */

 // var roomnum = app.room.attributes._id;

 // var collabTools = {
 //    notepad: 'https://pad.riseup.net/p/' + roomnum + '?showChat=false',
 //    spreadsheet: 'https://calc.mayfirst.org/' + roomnum, 
 //    chat: 'https://irc.koumbit.net/?channels=#' + roomnum + '&nick=guest'
 // }
