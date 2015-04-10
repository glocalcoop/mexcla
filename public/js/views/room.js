define(['text!templates/room.html'], function (roomTemplate) {
  console.log('room template function happening.');
  var roomView = Backbone.View.extend({
    el: $('#content'),
    render: function () {
      this.$el.html(roomTemplate);
    }
  });
  return roomView;
});
