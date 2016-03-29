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

