// Build routes for the application
define(['views/index', 'views/room', 'models/Room', 'models/StatusCollection'],
       function(IndexView, RoomView, Room, StatusCollection) {
  console.log('MexclaRouter executed');
  console.log(typeof(StatusCollection));
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
      var StatusCollection = new StatusCollection();
/*      StatusCollection.url = '/room/' + num + '/users';
      var StatusCollection = new StatusCollection();
      console.log("This is StatusCollection from router " + StatusCollection);*/
      this.changeView(new RoomView({
        // collection: StatusCollection;
      }));
      // StatusCollection.fetch();
      console.log("Status collection fetched " + StatusCollection);
    }
  });

  return new MexclaRouter();
});
