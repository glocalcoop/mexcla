define(['router'], function(router) {
  var initialize = function() {
    checkRoom(runApplication);
  };

  var checkRoom = function(callback) {
    $.ajax("/session", {
      method: "GET",
      success: function(result) {
        console.log("session callback");
        console.log(result);
        return callback(result);
      },
      error: function() {
        console.log("session callback");
        console.log(callback);
        return callback(false);
      }
    });
  };

  var runApplication = function(room) {
    console.log('Mexcla.js initialized.');
    var curpath = window.location.pathname;
    var roomPath = curpath.match(/room\/[0-9]+/gi);
    console.log('roomPath');
    console.log(roomPath);
    console.log('curpath');
    console.log(curpath);
    console.log(router);
    if(room == null && curpath != '/') {
      window.location.assign('/');
    }else if (roomPath != null && roomPath == null){
      window.location.assign('/room/' + room.room);
      console.log(roomPath);
    }
    Backbone.history.start();
  };

  return {
    initialize: initialize
  };
});
