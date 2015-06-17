define(['MexclaView', 'text!templates/room.html', 'text!templates/userlist.html',
        'models/RoomCollection', 'views/userlist'],
       function (MexclaView, roomTemplate, userlistTemplate, RoomCollection, userlistView) {
  console.log('room template function happening.');
  var roomView = MexclaView.extend({
    el: $('#content'),
    initialize: function() {
      this.collection.startLongPolling();
      this.collection.on('reset', function(){console.log("Fetched new data")});
      this.collection.on('change', this.render, this);
      this.listenTo(this.collection, 'reset', this.render);
      console.log("this in room initialize function.");
      console.log(this.collection);
      _.bindAll(this, 'render');
    },
    render: function () {
      console.log("this.collection");
      console.log(this.collection);
      this.$el.html(
        _.template(roomTemplate, this.collection.toJSON())
      );

      this.collection.on('sync', function() {
        $('.user_list').empty();
        this.each( function(model) {
          console.log("model fom room.js");
          console.log(model);
          var usersHtml = (new userlistView()).render(model).el;
          $(usersHtml).appendTo('.user_list');
        });
      });

    }
  });
  return roomView;
});
