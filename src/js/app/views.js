// .Lang({}) establishes the language text. Pass in object with text for the website.
// if .lang is not called, then English is used as the default. English as a default requires the presence of a global object 'websiteText', currently housed in the translation.js file
var IndexView = Backbone.View.extend({
  el: $('#content'),
  template: _.template($("#index-template").html()),
  lang: function(languageText) {
    this.languageText = languageText;
  },
  initialize: function() {
    this.languageText = websiteText.en;
  },
  render: function () {
    this.$el.html(this.template(this.languageText));
  }
});

var WelcomeText = Backbone.View.extend({
  el: $('#welcome-text'),
  template: _.template($('#welcome-text-template').html()),
  render: function() {
    var lang = this.model.attributes.lang;
    var welcomeText = {
      greetings: websiteText[lang].salutation + ", ",
      username: this.model.attributes.username
    };
    this.$el.html(this.template(welcomeText));
  }
});

var Register = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#register-template').html()),
  render: function() {
    var that = this;
    this.$el.html(this.template());
    this.$('#register-submit-button').click(function(e){
      console.log('clicked');
      var username =  that.$('#user-name').val();
      var lang = that.$('#lang-select').val();
      createUserAjax(username,lang).done(function(user){
        // create user model
        app.user = new User(user);
        // follow router back to homepage
        // the Ajax response creates a cookie, so this time the homepage will not show the register page
        app.router.navigate("#/", {trigger: true});
      });
    });
  }
});

// input: string, string ('en' or 'es')
// output: jqXHR-promise
function createUserAjax(username, lang) {
  return $.ajax({
    type: 'POST',
    url: '/users/new',
    data: {
      username: username,
      lang: lang
    }
  });
}
