var MexclaRouter = Backbone.Router.extend({
  routes: {
    "": "index",
    "*page": "default"
  },

  index: function() {
    console.log('index router function called');
    if (_.isUndefined(Cookies.get('id'))) {
      // show register page
      var register = new Register().render();
    } else {
      // log in to homepage
      app.homepage = new IndexView().render();
    }
  },
  default: function() {
    // this route will be executed if no other route is matched.
  }
});
