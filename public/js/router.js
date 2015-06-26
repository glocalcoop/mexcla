// Build routes for the application
define(['views/index', 'views/room', 'views/register', 'models/RoomCollection',
       'models/TextTranslation'],
       function(IndexView, RoomView, RegisterView, RoomCollection, TextTranslation) {
  console.log('MexclaRouter executed');
  console.log(typeof(StatusCollection));
  var MexclaRouter = Backbone.Router.extend({

    currentView: null,

    routes: {
      "index": "index",
      "register/:num": "register",
      "room/:num/:language": "room",
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

    room: function(num,language) {
      console.log("Room function in router.js ran.");
      console.log(window.location.hash);
      // Initialize a RoomCollection so we can display
      // all the users in the current room.
      var roomCollection = new RoomCollection([],{roomNum: num});
      // Supply the correct url to pull in the room's users
      roomCollection.url = '/rooms/' + num + '/users';
      // Add text translation model
      var Trans = new TextTranslation();
      if(language == 'es') {
        var lang = Trans.es;
      }else{
        var lang = Trans.en;
      }

      // When we initialize the RoomView, add the RoomCollection
      // to the view so the view can pull in the current participants.
      this.changeView(new RoomView({
        lang: lang,
        collection: roomCollection,
        roomNum: num,
      }));
      roomCollection.fetch();
    }
  });

  return new MexclaRouter();
});
