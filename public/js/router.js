// Build routes for the application
define(['views/index', 'views/room', 'views/register', 'models/RoomCollection'],
       function(IndexView, RoomView, RegisterView, RoomCollection) {
  console.log('MexclaRouter executed');
  console.log(typeof(StatusCollection));
  var MexclaRouter = Backbone.Router.extend({

    currentView: null,

    routes: {
      "index": "index",
      "register/:num": "register",
      "room/:num": "room",
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

    register: function(num) {
      this.changeView(new RegisterView({
        roomNum: num,
      }));
    },

    room: function(num) {
      console.log("Room function in router.js ran.");
      // Initialize a RoomCollection so we can display
      // all the users in the current room.
      var roomCollection = new RoomCollection([],{roomNum: num});
      // Supply the correct url to pull in the room's users
      roomCollection.url = '/rooms/' + num + '/users';

      // When we initialize the RoomView, add the RoomCollection
      // to the view so the view can pull in the current participants.
      this.changeView(new RoomView({
        // model: model
        collection: roomCollection,
        roomNum: num,
      }));
      roomCollection.fetch();
    }
  });

  return new MexclaRouter();
});
