var MexclaRouter = Backbone.Router.extend({
  routes: {
    "": "index",
    "room/:roomnum": "room",
    "*page": "default"
  },

  index: function() {
    if (_.isUndefined(Cookies.get('id'))) {
      // show register page
      var register = new Views.Register().render();
    } else {
      this.makeUserIfNeeded();
      // log in to homepage
      app.homepage = new Views.IndexView();
    }
  },
  room: function(roomnum) {
    this.makeUserIfNeeded();
    if (_.isUndefined(app.room)) {
      app.room = new Models.Room({roomnum: roomnum}).fetchByNum();
    }
    app.roomView = new Views.Room({model: app.room}).render();
  },
  default: function() {
    // this route will be executed if no other route is matched.
  },
  makeUserIfNeeded: function() {
    // if user is undefined, which would happen when someone returns to the page and has a cookie stored, then it's a new session and we need to create the user object.
    if (_.isUndefined(app.user)){
      var userid = Cookies.get('id');
      if (_.isUndefined(userid)) {
        // if no cookies send back to register
        app.router.navigate("#/", {triggennr: true});
      } else {
        // create user and fetch details
        app.user = new Models.User({_id: userid});
        app.user.fetch();
      }
    }
  }
});
