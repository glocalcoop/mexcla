app.init= function(){
  app.router = new MexclaRouter();
  // app.user = new Models.User();
  app.user = null;
  Backbone.history.start(); // must call this to start router
};
