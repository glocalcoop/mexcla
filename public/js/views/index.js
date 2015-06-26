define(['text!templates/index.html'], function (indexTemplate) {
  var indexView = Backbone.View.extend({
    el: $('#content'),
    initialize: function(options) {
      this.options = options;
      join = this.options.lang.join;
      enter = this.options.lang.enter;
      create = this.options.lang.create;
    },
    render: function () {
      this.$el.html(_.template(indexTemplate));
    }
  });
  return indexView;
});
