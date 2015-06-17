// Build a collection to hold all the users
// in a given room.
define(['models/User'], function(User) {
  var RoomCollection = Backbone.Collection.extend({
    model: User,
    // Add default variables for polling the database
    // for changes.
    longPolling: false,
    intervalMinutes: 1,
    initialize: function() {
      _.bindAll(this, 'startLongPolling', 'stopLongPolling', 'executeLongPolling', 'onFetch');
    },
    // Initialize polling for periodic database checks.
    startLongPolling: function(intervalMinutes) {
      this.longPolling = true;
      if(intervalMinutes) {
        this.intervalMinutes = intervalMinutes;
      }
      this.executeLongPolling();
    },
    stopLongPolling: function() {
      longPolling = false;
    },
    executeLongPolling: function() {
      this.fetch({ success: this.onFetch });
    },
    onFetch: function() {
      if(this.longPolling) {
        setTimeout(this.executeLongPolling, 1000 * 60 * this.intervalMinutes);
      }
    }
  });
  return RoomCollection;
});
