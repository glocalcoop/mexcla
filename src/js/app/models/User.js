/**
 * Interpretation Rules
 *
 * Interpret
 *   When user opts to become interpreter
 *   - She is added to the channel's users array
 *   - She is added as channel interpreter
 *   - Only Leave button appears
 *   Interpret button appears when channel has no interpreter
 * Hear (Join)
 *   When user opts to become a listener
 *   - She is added to the channel's users array
 *   - Only the Leave button appears
 *   Join button appears when user is not already in the channel (as 
 *   listener or interpreter)
 * Main (Leave)
 *   Leave button appears when user is in the channel
 *
 */

Models.User = Backbone.Model.extend({
  idAttribute: "_id",
  urlRoot: "/users",
  raiseHand: function() {
    var roomId = app.room.get('_id');
    Models.raiseHandAjax(roomId).done(function(data){
      // Do something when successful?
      // or show 'raising hand in progress?'
    });
  },
  lowerHand: function() {
    var roomId = app.room.get('_id');
    Models.lowerHandAjax(roomId).done(function(data){
      // 
    });
  },
  callOn: function(personCalledOnId) {
    var roomId = app.room.get('_id');
    Models.callOnAjax(roomId, personCalledOnId).done(function(data){
      // when successful
    });
  },
  callOff: function(personCalledOnId) {
    var roomId = app.room.get('_id');
    Models.callOffAjax(roomId, personCalledOnId).done(function(data){
      // when successful
    });
  },
  isInAChannel: function() {
    var userId = this.get('_id');
    var channel = _.find(app.room.get('channels'), function(channel){
      return _.contains(channel.users, userId);
    });
    return (_.isUndefined(channel)) ? false : channel.lang;
  },
  /**
   * Is a user the interpreter of the given language channel?
   * @param {string} lang
   * @returns {boolean} 
   */
  isInterpreter: function(lang) {
    var channel = _.find(app.room.get('channels'), function(channel){
      return channel.lang === lang;
    });
    return (channel.interpreter === this.get('_id'));
  },
  /**
   * Is a user the interpreter of the given language channel? (Channel ID Version)
   * @param {string} channelId
   * @returns {boolean} 
   */
  isInterpreterByChannelId: function(channelId) {
    var channel = _.find(app.room.get('channels'), function(channel){
      return channel._id === channelId;
    });
    return (channel.interpreter === this.get('_id'));
  },
  /**
   * Returns user status: 'main', 'interpret', 'hear'
   * @return {string}
   */
  getStatus: function(){
    var userChannelLang = this.isInAChannel();
    if (userChannelLang) {
      if (this.isInterpreter(userChannelLang)) {
        return 'interpret';
      } else {
        return 'hear';
      }
    } else {
      return 'main';
    }
  }
});
