var MexclaRouter = Backbone.Router.extend({
  routes: {
    "": "index",
    "room/:roomnum": "room",
    "*page": "default"
  },

  index: function() {
    this.syncUser();
    // log in to homepage
    app.homepage = new Views.IndexView();
  },
  room: function(roomnum) {
    if (this.noUserCookie()) {
      this.navigate("/", {trigger: true});
    } else {
      this.syncUser();
      if (_.isUndefined(app.room)) {
        app.room = new Models.Room({roomnum: roomnum}).fetchByNum(this.createRoomView);
      } else {
        this.createRoomView();
      }
    }
  },
  default: function() {
    // this route will be executed if no other route is matched.
  },
  syncUser: function() {
    // if user is undefined, which would happen when someone returns to the page and has a cookie stored, then it's a new session and we need to create the user object.
      var userid = Cookies.get('id');
      var lang = Cookies.get('lang');
      if (!_.isUndefined(userid)) {
        // set user
        app.user.set('_id', userid);
        if (!_.isUndefined(lang)) {
          app.user.set('lang', lang);
        }
        app.user.fetch();
      }
  },
  createRoomView: function () {
    app.roomView = new Views.Room({model: app.room}).render();    
  },
  noUserCookie: function() {
    return _.isUndefined(Cookies.get('id'));
  }
});
