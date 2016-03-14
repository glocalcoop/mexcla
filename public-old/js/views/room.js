define(['MexclaView', 'text!templates/room.html', 'text!templates/userlist.html',
        'models/RoomCollection', 'models/TextTranslation', 'models/User', 'views/userlist'],
       function (MexclaView, roomTemplate, userlistTemplate, RoomCollection,
                  TextTranslation, User, userlistView) {
  console.log('room template function happening.');
  var roomView = MexclaView.extend({
    el: $('#content'),
    initialize: function(options) {
      // Utilize the options passed from the router.
      this.options = options;
      // Start polling the collection of users in the room.
      this.collection.startLongPolling();
      this.collection.on('reset', function(){console.log("Fetched new data")});
      this.collection.on('change', this.render, this);
      this.listenTo(this.collection, 'reset', this.render);
      // set roomNum variable with the correct room number
      // to be picked up by the room template.
      roomNum = this.options.roomNum;
      connect = this.options.lang.connect;
      conference = this.options.lang.conference;
      mute = this.options.lang.mute;
      unmute = this.options.lang.unmute;
      original = this.options.lang.original;
      interpretation = this.options.lang.interpretation;
      provide = this.options.lang.provide;
      participants = this.options.lang.participants;
      room = this.options.lang.room;
      // this.User = new User();
      // this.TextTranslation = new TextTranslation();
      // connect = this.TextTranslation.trans.connect.es;
      // var TextTranslation = new TextTranslation();
      // connect = TextTranslation.connect.es;
      // this.collection.roomNum = {"roomNum": this.collection.roomNum};
      console.log("options");
      console.log(this.options);
      // bind all render functions to this so that
      // we maintain the scope during render.
      _.bindAll(this, 'render');
    },
    render: function () {
      this.$el.html(
        _.template(roomTemplate)
      );

      // We use on sync here, because the collection.length
      // would otherwise be zero and our each function would fail.
      this.collection.on('sync', function() {
        $('#participants').empty();
        this.each( function(model) {
          // Apply our user list to the userlist.html template.
          var usersHtml = (new userlistView()).render(model).el;
          $(usersHtml).appendTo('#participants');
        });
      });

    }
  });
  return roomView;
});
