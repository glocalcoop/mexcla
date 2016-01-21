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

// View: "main" page where user picks between creating a room or joining an existing one
// it renders language according to app.user.attributes.lang
// and re-renders when user model language changes
Views.IndexView = Backbone.View.extend({
  el: $('#content'),
  template: _.template($("#index-template").html()),
  initialize: function() {
      this.setLang();
      // watch for changes
      this.listenTo(app.user, 'change:lang', function(){
        this.setLang();
        this.render();
      });
      this.render();
  },
  render: function () {
    this.$el.html(this.template(websiteText[this.lang]));
    new Views.WelcomeText({model: app.user});
    // click on new room button triggers: ajax request to create room, creates model, and then navigates to: /room/:roomnum 
    this.$('#create-new-room-button').click(function(e){
      Views.createRoomAjax().done(function(room){
        app.room = new Models.Room(room);
        app.router.navigate('room/' + room.roomnum, {trigger: true});
      }); 
    });
    // Join Room Button
    this.$('#room-number-button').click(function(e){
      var roomnum = $('#room-number').val();
      app.router.navigate('room/' + roomnum, {trigger: true});
    });
    
    return this;
  },
  setLang: function() {
    // fallback to English if lang is missing
    this.lang = (_.isUndefined(app.user.attributes.lang)) ? 'en' : app.user.attributes.lang;
  }
});

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

Views.Register = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#register-template').html()),
  render: function() {
    var that = this;
    this.$el.html(this.template());
    this.$('#register-submit-button').click(function(e){
      var username = that.$('#user-name').val();
      var lang = that.$('#lang-select').val();
      Views.createUserAjax(username,lang).done(function(user){
        // create user model
        app.user = new Models.User(user);
        // follow router back to homepage
        // the Ajax response creates a cookie, so this time the homepage will not show the register pae
        app.router.navigate("#/", {trigger: true});
      });
    });
    return this;
  }
});

// unlike the other Views, this one is appended to #content instead of replacing it
// use; new Views.RoomSidebar({model: app.room});
Views.RoomSidebar = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#room-sidebar-template').html()),
  initialize: function() {
    this.listenTo(this.model, "change:users", this.renderParticipants);
  },
  render: function() {
    this.$el.append(this.template(websiteText[app.user.attributes.lang]));
    this.renderParticipants();
    return this;
  },
  renderParticipants: function() {
    var selector = '#participants';
    $(selector).html('');
   _.each(this.model.attributes.users, function(user){
       var li =_.template($('#participant-row-template').html());
     $(selector).append(li(user));
    });
    return this;
  }
});


// use: new Views.Room({model: app.room})
Views.Room = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#room-template').html()),
  render: function() {
    var templateData = _.extend(websiteText[this.lang], this.model.attributes);
    this.$el.html(this.template(templateData));
    this.sidebar.render();
    return this;
  },
  initialize: function() {
    this.lang = app.user.attributes.lang;
    this.listenTo(app.user, 'change:lang', function(){
      this.lang = app.user.attributes.lang;
      this.render();
    });
    this.sidebar = new Views.RoomSidebar({model: app.room});
  }
});
