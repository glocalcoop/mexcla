define(['MexclaView', 'text!templates/room.html', 'text!templates/userlist.html',
        'models/RoomCollection', 'views/userlist'],
       function (MexclaView, roomTemplate, userlistTemplate, RoomCollection, userlistView) {
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

      // this.collection.roomNum = {"roomNum": this.collection.roomNum};

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
