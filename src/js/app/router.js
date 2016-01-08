var MexclaRouter = Backbone.Router.extend({
  routes: {
    "": "index",
    "*page": "default"
  },

  index: function() {
o    if (_.isUndefined(Cookies.get('id'))) {
      // show register page
      var register = new Register().render();
    } else {
      // log in to homepage
      app.homepage = new IndexView().render();
      // if user is undefined, which would happen when someone returns to the page and has a cookie stored, then it's a new session and we need to create the user object.
      if (_.isUndefined(app.user)){
        makeNewUser();
      }
      app.user.fetch();
    }
  },
  default: function() {
    // this route will be executed if no other route is matched.
  }
});

function makeNewUser() {
  var userid = Cookies.get('id');
  app.user = new User({id: userid});  
}
