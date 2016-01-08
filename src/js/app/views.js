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

//.Lang({}) establishes the language text. Pass in object with text for the website.
// if .lang is not called, then English is used as the default. English as a default requires the presence of a global object 'websiteText', currently housed in the translation.js file
Views.IndexView = Backbone.View.extend({
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
    new Views.WelcomeText({model: app.user});
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
      var username =  that.$('#user-name').val();
      var lang = that.$('#lang-select').val();
      Views.createUserAjax(username,lang).done(function(user){
        // create user model
        app.user = new Models.User(user);
        // follow router back to homepage
        // the Ajax response creates a cookie, so this time the homepage will not show the register page
        app.router.navigate("#/", {trigger: true});
      });
    });
  }
});

