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
  
}

Views.hasChannelInterpreter = function(channelId) {
  var channel = _.findWhere(app.room.get('channels'), {
    _id: channelId
  });
  return channel.interpreter !== '';
}

Views.isChannelInterpreter = function(channelId, userId) {
  return _.findWhere(app.room.get('channels'), {
    _id: channelId, 
    interpreter: userId
  });
}

Views.isInChannel = function(channelId, userId) {
  var channel = _.findWhere(app.room.get('channels'), {_id: channelId });
  if (_.isUndefined(channel.users)) {
    return false;
  } else {
    return _.contains(channel.users, userId);
  }
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
}


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
    this.switchLang();
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
         * JoinRoom @returns a {function}
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
  switchLang: function() {
    $('#language-links a').click(function(event) {
      event.preventDefault();
      app.user.set('lang', $(this).data('lang'));
    });
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
  },

});




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
  // Might need to change to use class, if not unique on page
  // el: $('.mute-controls');
  template: _.template($('#mute-controls-template').html()),
  initialize: function() {
   //  this.userid = app.user.get('_id');
  },
  render: function(userid) {
    this.userid = userid;
    this.$el.html(this.template({}));
    this.muteToggle(userid);
  },
  muteToggle: function(userid) {
    var that = this;
    if(app.room.isUserMuted(userid)) {
      $(this).addClass('muted');
    } else {
      $(this).removeClass('muted');
    }
    $('#' + userid + ' .mute').click(function(event) {
      event.preventDefault();
      app.room.mute(that.userid);
      $(this).toggleClass('muted');
    });
  }
});

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
 */
Views.Channel = Backbone.View.extend({
  template: _.template($('#channel-row-template').html()),
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
    var interpretControlsEl = $('.interpret-controls');
    new Views.ChannelInterpretControls({ el: interpretControlsEl }).render(data);
    $('#channels .interpret').click(function(event) {
      event.preventDefault();
      app.room.addInterpreterToChannel(data.channel._id, app.user.id);
    });
  },
  joinChannel: function(data) {
    var joinControlsEl = $('.join-controls');
    new Views.ChannelJoinControls({ el: joinControlsEl }).render(data);
    $('#channels .join').click(function(event) {
      event.preventDefault();
      app.room.joinChannel(app.user.id, data.channel._id);
    });
  },
  leaveChannel: function(data) {
    var leaveControlsEl = $('.leave-controls');
    new Views.ChannelLeaveControls({ el: leaveControlsEl }).render(data);
    $('#channels .leave').click(function(event) {
      event.preventDefault();
      app.room.leaveChannel(app.user.id, data.channel._id);
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
        'users': [app.user.id]
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

