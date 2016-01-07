var MexclaRouter = Backbone.Router.extend({
  routes: {
    "index": "index"
  },

  index: function() {
    if (_.isUndefined(Cookies.get('id'))) {
      // show log-in page
      
    } else {
      // log in
      
    }
  }
});


// routes

