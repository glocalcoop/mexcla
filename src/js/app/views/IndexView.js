/**
 * Index
 * View: "main" page where user picks between creating a room or joining an existing one it renders language according to app.user.attributes.lang and re-renders when user model language changes
 * @class
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
