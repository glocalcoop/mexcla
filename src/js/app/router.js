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
    this.syncUser();
    var roomNumAsInt = parseInt(roomnum, 10);
    if (!this.isLoggedIn()) {
      //displayRegisterModal()
    } else {
      if (_.isUndefined(app.room) || app.room.get('roomnum') !==  roomNumAsInt) {
        app.room = new Models.Room({roomnum: roomNumAsInt}).fetchByNum();
      }
      app.roomView = new Views.Room({model: app.room}).render();
    }
  },
  default: function() {
    // this route will be executed if no other route is matched.
  },
  // Handles creation of Model.User for a few different scenarios:
  // - If user is not logged in, it sets app.user to be an empty user model.
  // - If the user is logged in, but the user model has not been created, it provides the user model with the ID of the user and fetches the details from the server.
  // If there is a language cookie it updates the user model accordingly.
  syncUser: function() {
    var lang = Cookies.get('lang');
    if (!app.user) {
      app.user = new Models.User();
    }
    if (this.isLoggedIn() && _.isUndefined(app.user.get('_id'))) {
      var userid = Cookies.get('id');
      app.user.set('_id', userid);
      app.user.fetch();
    }
    this.setUserLang();
  },
  isLoggedIn: function() {
    return !_.isUndefined(Cookies.get('id'));
  },
  setUserLang: function() {
    var lang = Cookies.get('lang');
    if (!_.isUndefined(lang)) {
      app.user.set('lang', lang);
    }
  }
});
