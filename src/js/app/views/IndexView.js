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
    var that = this;
    this.$el.html(this.template(websiteText[this.lang]));
    this.switchLang();

    if (!_.isUndefined(app.user)) {
      new Views.WelcomeText({model: app.user});
      new Views.BrandingText({model: app.user});
    }

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
        that.joinRoom()();
      } else {
        new Views.RegisterModal().render(that.JoinRoom());
      }
    });
    
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
  }
});
