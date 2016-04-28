/**
 * Audio Connect
 * use: new Views.ConnectAudio({model: app.audio})
 */
Views.ConnectAudio = Backbone.View.extend({
  template: '',
  el: $('#connect-button'),
  initialize: function(userId) {
    this.render(userId);
    this.listenTo(this.model, 'status', this.updateCallStatus);
  },
  render: function() {
    this.connectAudio();
  },
  updateCallStatus: function(status){
    switch(status) {
    case 'connecting':
      $('#connect-button').addClass('connecting');
      $('#connect-button').html(websiteText[app.user.get('lang')].connecting + ' <i class="icon"></i>');
      break;
    case 'active':
      /**
       * Conditions: user is in the process of being connected
       * On connection:
       *   User should be connected to audio
       *   Connecting button should be replaced by Disconnect button
       */
      $('#connect-button').removeClass('connecting');
      $('#connect-button').addClass('connected');
      $('#connect-button').html(websiteText[app.user.get('lang')].disconnect + ' <i class="icon"></i>');
      break;
    case 'hangup':
      /**
       *  On disconnection:
       *  Disconnect button should be replaced by Connect button
       */
      $('#connect-button').removeClass('connected');
      $('#connect-button').html(websiteText[app.user.get('lang')].connect + ' <i class="icon"></i>');
      break;
    }
  },
  connectAudio: function() {
    var that = this;
    $('#connect-button').click(function(event) {
      event.preventDefault();
      var text = websiteText[app.user.get('lang')];
      var currCall = (null != that.model.cur_call) ? that.model.cur_call : null;
      /**
       * Conditions: user is registered, in room and not connected
       * On click:
       *   Audio connection should be initiated
       *   Connect button should be replaced by Connecting button
       */
      if(!currCall) {
        // Call not active
        if (!that.model.verto) {
          that.model.login();
          that.updateCallStatus('connecting');
          that.model.on('logged_in', function(){
            that.model.call_init();
            });
        } else {
          that.updateCallStatus('connecting');
          that.model.call_init();
        } 
      }
      else {
        /**
         * Conditions: user is connected to audio
         * On click:
         *   Audio connection hangup should be initiated
         */
        that.model.hangup();
       }
    });
  }
});

