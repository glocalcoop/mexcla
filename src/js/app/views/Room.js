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
