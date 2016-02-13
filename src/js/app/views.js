// input: string, string ('en' or 'es')
// output: jqXHR-promise
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

Views.createRoomAjax = function() {
  return $.ajax({
    type: 'GET',
    url: '/room/create'
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
 * Register
 */
Views.RegisterModal = Backbone.View.extend({
  initialize: function() {
  },
  render: function(afterwards) {
    $('#register-modal').modal("show");
    $('#register-submit-button').click(function(){
      var username = $('#register-modal #user-name').val();
      var lang = $('#register-modal  #lang-select').val();
      Views.createUserAjax(username, lang).done(function(user){
        app.user.set(user);
        // $('#register-modal').modal('hide') -> doesn't appear to work.
        // the focus is messed up...i'll just deal with it later and do this...
        $('#register-modal').hide();
        afterwards();
      });
    });
  }
});

/**
 * Index
 */
// View: "main" page where user picks between creating a room or joining an existing one
// it renders language according to app.user.attributes.lang
// and re-renders when user model language changes
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
    this.$('#create-new-room-button').click(function(e){
      if (Views.isThereAUser()) {
        that.createRoom();
      } else {
        new Views.RegisterModal().render(that.createRoom);
      }
    });
    this.$('#room-number-button').click(function(e){
      if (Views.isThereAUser()) {
        that.JoinRoom()(); // ()() is not a typo...JoinRoom returns a function.
      } else {
        new Views.RegisterModal().render(that.JoinRoom());
      }
    });
    return this;
  },
  setLang: function() {
    // fallback to English if lang is missing
    this.lang = (_.isUndefined(app.user.attributes.lang)) ? 'en' : app.user.attributes.lang;
  },
  createRoom: function() {
    Views.createRoomAjax().done(function(room){
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
  }
});

/**
 * Welcome
 */
// use: new WelcomeText({model: app.user})
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
 * Room
 */
// use: new Views.Room({model: app.room})
Views.Room = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#room-template').html()),
  render: function() {
    var templateData = _.extend(websiteText[this.lang], this.model.attributes);
    this.$el.html(this.template(templateData));
    this.sidebar.render();
    this.renderChannel();
    if (this.isModerator) {
      this.renderControls();
    }
    return this;
  },
  initialize: function() {
    this.lang = app.user.attributes.lang;
    this.listenTo(app.user, 'change:lang', function(){
      this.lang = app.user.attributes.lang;
      this.render();
    });
    this.sidebar = new Views.RoomSidebar({model: app.room});
    this.listenTo(this.model, 'change:channels', this.renderChannel);
  },
  renderChannel: function() {
    var channels = this.model.get('channels');
    if (!_.isEmpty(channels)) {
      _.each(channels, function(channel){
        // display channel
        new Views.Channel({});
      });
    }
    return this;
  },
  renderControls: function() {
  
  }
});

/**
 * Room Sidebar
 */
// unlike the other Views, this one is appended to #content instead of replacing it
// use; new Views.RoomSidebar({model: app.room});
Views.RoomSidebar = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#room-sidebar-template').html()),
  initialize: function() {
    this.listenTo(this.model, "change:users", this.renderParticipants);
    this.listenTo(this.model, "change:channels", this.renderChannels);
  },
  render: function() {
    this.$el.append(this.template(websiteText[app.user.attributes.lang]));
    this.renderParticipants();
    this.renderChannels();
    return this;
  },
  renderParticipants: function() {
    var selector = '#participants';
    $(selector).html('');
    _.each(this.model.attributes.users, function(user){
      var participantRow = _.template($('#participant-row-template').html());
      $(selector).append(participantRow(user));

      // Add moderator indicator to row of moderator
      if(Views.isModerator( user._id )) {
        var moderatorInfoEl = $('#' + user._id + ' .is-moderator');
        var moderatorInfoHtml = '<span class="moderator" data-toggle="tooltip" title="Moderator"><i class="icon"></i></span>';
        $(moderatorInfoEl).append(moderatorInfoHtml);
      }

      // TODO: Add channel indicator to row if in channel

      // TODO: Add queue indicator to row if queued

      // If current user is moderator, add moderator controls to all but own row
      if(Views.isModerator( app.user.id ) && !Views.isModerator( user._id ) ) {
        var moderatorControlsEl = $('#' + user._id + ' .moderator-controls');
        var muteControlsEl = $('#' + user._id + ' .mute-controls');
        new Views.ModeratorControls({
          el: moderatorControlsEl
        }).render();
        new Views.MuteControls({
          el: muteControlsEl
        }).render();
      }

      // Add current user controls to row of current user
      if(Views.isCurrentUser( user._id )) {
        var currentUserEl = $('#' + user._id + ' .current-user-controls');
        var muteControlsEl = $('#' + user._id + ' .mute-controls');
        new Views.CurrentUserControls({
          el: currentUserEl
        }).render();
        new Views.MuteControls({
          el: muteControlsEl
        }).render();
    
      }

    });
    return this;
  },
  renderChannels: function() {
    var selector = '#channels';
    $(selector).html('');
    _.each(this.model.attributes.channels, function(channel){
      var channelRow = _.template($('#channel-row-template').html());
      $(selector).append(channelRow(channel));
    });

    return this;
  }

});

/**
 * Participant Info and Controls
 */
Views.ModeratorControls = Backbone.View.extend({
  // Might need to change to use class, if not unique on page
  // el: $('.moderator-controls');
  template: _.template($('#moderator-controls-template').html()),
  render: function() {
    this.$el.html(this.template({}));
  }
});

Views.CurrentUserControls = Backbone.View.extend({
  // Might need to change to use class, if not unique on page
  // el: $('.current-user-control');
  template: _.template($('#current-user-controls-template').html()),
  render: function() {
    this.$el.html(this.template({}));
  }

});

Views.MuteControls = Backbone.View.extend({
  // Might need to change to use class, if not unique on page
  // el: $('.mute-controls');
  template: _.template($('#mute-controls-template').html()),
  render: function() {
    this.$el.html(this.template({}));
  }

});


/**
 * Channel
 */
Views.Channel = Backbone.View.extend({
  template: _.template($('#channel-row-template').html()),
  render: function() {
    this.$el.html(this.template({}));
  }
});


Views.ChannelOptions = Backbone.View.extend({
  // where we will provide the options to modify a channel: add interpreter, join, leave, delete, etc.
});

// TODO: turn channel html into template
// but for now:
$(document).ready(function(){
  $('#add-channel-button').click(function(){
    new Views.AddChannelModal({
      model: app.room
    }).render();
  });
});


// use new Views.AddChannelModal({model: app.room})
Views.AddChannelModal = Backbone.View.extend({
  initialize: function() {
    new Views.ChannelTranslatorOptionsList({model: app.room});
  },
  render: function(model) {
    $('#channel-modal').modal("show");
    $('#channel-submit-button').click(function(e){
      var lang = $('#channel-lang-select').val();
      var translator = $('#channel-translator-options').val();
      var name = $('#channel-name').val();
      app.room.createChannel({
        'name': name,
        'lang': lang, 
        'translator': translator
      });
    });
  }
});

Views.ChannelTranslatorOptionsList = Backbone.View.extend({
  el: $('#channel-modal #channel-translator-options'),
  template: _.template('<option><%= username %></option>'),
  initialize: function() {
    this.render();
  },
  render: function(){
    var that = this;
    // TODO: have value be id of user
    var html = '<option value="">Select a translator</option><option value="none">None</option>';
    this.$el.html(html);
    var users = this.model.get('users');
    _.each(users, function(user){
       that.$el.append(that.template(user));
    });
  }
});
