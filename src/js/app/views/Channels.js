/**
 * Channel
 * @class
 */
Views.Channel = Backbone.View.extend({
  template: _.template($('#channel-row-template').html()),

  /**
   * Render
   * @memberOf Views.Channel#
   * @param {}
   * @returns {this}
   */
  render: function(channel) {
    var data = {
      text: websiteText[app.user.attributes.lang],
      channel: channel
    };
    this.$el.append(this.template(data));
    /**
     * Moderator can't be interpreter
     * Moderator can't join a channel
     */
    if( !Views.isModerator(app.user.id) ) {
      this.renderControls(data);
    }

    return this;
  },
  /**
   * Renders the controls for each channel
   * @param {Object} data - Contains channel and other information for template rendering
   * @param {Object} data.channel
   * @returns {this}
   */
  renderControls: function(data) {
    if(!Views.hasChannelInterpreter(data.channel._id)) {
      this.becomeInterpreter(data);
    }

    /**
     * Render switchAudio if isInterpreterByChannelID
     */
    if(app.user.isInterpreterByChannelId(data.channel._id)) {
      this.switchAudio(data);
    }

    if(Views.isInChannel(data.channel._id, app.user.id)) {
      this.leaveChannel(data);
    } else {
      this.joinChannel(data);
    }

    return this;
  },
  becomeInterpreter: function(data) {
    var interpretControlsEl = '.interpret-controls';
    new Views.ChannelInterpretControls({ el: interpretControlsEl }).render(data);
    $('#channels .interpret').click(function(event) {
      event.preventDefault();
      app.room.becomeInterpreter(app.user.id, data.channel._id);
    });
  },
  switchAudio: function(data) {
    var switchAudioControlsEl = '.switch-audio-controls';
    new Views.SwitchAudioControls({ el: switchAudioControlsEl  }).render(data);
    $('#channels .switch-audio').click(function(event) {
      event.preventDefault();
      app.audio.interpretSpeak($(this).attr('data-status'));
      $(this).attr('data-status', function(index,attr){
        return attr == 'on' ? 'off' : 'on';
      });
    });
  },
  joinChannel: function(data) {
    var joinControlsEl = '.join-controls';
    new Views.ChannelJoinControls({ el: joinControlsEl }).render(data);
    $('#channels .join').click(function(event) {
      event.preventDefault();
      app.room.joinChannel(app.user.id, data.channel._id);
    });
  },
  leaveChannel: function(data) {
    var leaveControlsEl = '.leave-controls';
    new Views.ChannelLeaveControls({ el: leaveControlsEl }).render(data);
    $('#channels .leave').click(function(event) {
      event.preventDefault();
      app.room.leaveChannel(app.user.id, data.channel._id);
    });
  }
});
