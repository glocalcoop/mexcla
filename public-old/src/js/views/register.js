define(['MexclaView', 'text!templates/register.html'],
  function(MexclaView, registerTemplate) {
  var registerView = MexclaView.extend({
    el: $('#content'),
    initialize: function(options) {
      this.options = options;
      roomNum = this.options.roomNum;
    },
    render: function() {
      this.$el.html(registerTemplate);
      $('#room-num').val(roomNum);
    }
  });
  return registerView;
});
