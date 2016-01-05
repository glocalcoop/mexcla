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


