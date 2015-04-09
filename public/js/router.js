// Build routes for the application
define(['views/index', 'views/room'],
       function(IndexView, RoomView) {
  var MexclaRouter = Backbone.Router.extend({
    currentView: null,

    routes: {
      "index": "index",
      "room": "room"
    },

    changeView: function(view) {
      if ( null != this.currentView ) {
        this.currentView.undelegateEvents();
      }
      this.currentView = view;
      this.currentView.render();
    },

    index: function() {
      this.changeView(new IndexView());
    },

    room: function() {
      this.changeView(new RoomView());
    }
  });

  return new MexclaRouter();
});
