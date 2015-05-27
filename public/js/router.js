// Build routes for the application
define(['views/index', 'views/room', 'models/Users'],
       function(IndexView, RoomView) {
  console.log('MexclaRouter executed');
  var MexclaRouter = Backbone.Router.extend({

    currentView: null,

    routes: {
      "index": "index",
      "room/:num": "room"
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

    room: function(num) {
      console.log("Room function in router.js ran.");
      this.changeView(new RoomView());
    }
  });

  return new MexclaRouter();
});
