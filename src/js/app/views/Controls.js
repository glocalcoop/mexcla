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
 * Render Switch Audio Control
 * If user is interpreter in channel, render control
 */
Views.SwitchAudioControls = Backbone.View.extend({
  template: _.template($('#switch-audio-controls-template').html()),
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
