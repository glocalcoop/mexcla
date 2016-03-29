/**
 * Room Sidebar
 * unlike the other Views, this one is appended to #content instead of replacing it
 * use: new Views.RoomSidebar({model: app.room});
 */
Views.RoomSidebar = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#room-sidebar-template').html()),
  initialize: function() {
    this.listenTo(this.model, "change:users", this.renderParticipants);
    this.listenTo(this.model, "change:handsQueue", this.renderParticipants);
    this.listenTo(this.model, "change:channels", this.renderChannels);
    this.listenTo(this.model, "change:channels", this.renderParticipants);
  },
  render: function() {
    var templateData =  _.clone(websiteText[app.user.get('lang')]);
    templateData.roomnum = this.model.get('roomnum');
    templateData.roomLink = $(location).attr('href');
    this.$el.append(this.template(templateData));
    this.renderParticipants();
    this.renderChannels();
    new Views.AddChannelButton().render(templateData);
    return this;
  },
  renderParticipants: function() {
    var that = this;
    var selector = '#participants';
    $(selector).html('');
    _.each(this.model.attributes.users, function(user){
      var participantRow = _.template($('#participant-row-template').html());
      $(selector).append(participantRow(user));
      Views.util.participants.moderator(user);
      Views.util.participants.channelInfo(user);
      Views.util.participants.moderatorControls(user);
      Views.util.participants.userControls(user);
      Views.util.participants.queueDisplay(user);
    }); // end of each loop
    return this;
  },
  renderChannels: function() {
    var channels = this.model.get('channels');
    var channelsEl = '#channels';
    $(channelsEl).empty();
    _.each(channels, function(channel){
        // display channel
        new Views.Channel({ el: channelsEl }).render(channel);
      });
    return this;
  }
});
