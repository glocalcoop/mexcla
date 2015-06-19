define(['router'], function(router) {
  var initialize = function() {
    // checkRoom(runApplication);
    checkUser(runApplication);
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

  // Update our session variable with the room
  // number from the room hash.  This will reflect
  // the last room visited by the user.
  var updateSession = function(callback, roomnum) {
    $.ajax('/sess-room/' + roomnum, {
      method: "GET",
      success: function(result) {
        return callback(result);
      },
      error: function() {
        return callback(false);
      }
    });
  };

  // callback function for updateSession.
  var sessionResult = function(sess) {
    return sess;
  };

  var checkUser = function(callback) {
    $.ajax("/check-user", {
      method: "GET",
      success: function(result) {
        console.log("check-user callback");
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

  var evalUsername = function(username) {
    if( null != username && username != undefined
      && username != "" ) {
      return true;
    }else{
      return false;
    }
  };

  var runApplication = function(sess) {
    console.log('Mexcla.js initialized.');
    var curpath = window.location.pathname;
    var roomPath = curpath.match(/room\/[0-9]+/gi);
    console.log(window.location.hash);
    var hash = window.location.hash;
    var match = hash.match(/\#room\/[0-9]+/i);
    console.log('hash');
    console.log(match);
    // if the roomnum is set in the session direct the
    // user to that room.  If it's not set, but the user
    // is currently in a room, make reloads direct to the
    // room.  Otherwise load the index page.
    if(sess.roomnum != null || sess.roomnum != undefined) {
      updateSession(sessionResult, hash.split('/')[1]);

      if(evalUsername(sess.username) != false) {
        window.location.hash = 'room/' + sess.roomnum;
      }else{
        window.location.hash = 'register/' + sess.roomnum;
          console.log("this is sess during room load");
          console.log(sess);
      }
    }else if(match != null) {
      updateSession(sessionResult, hash.split('/')[1]);
      if(evalUsername(sess.username) != false) {
        window.location.hash = hash;
      }else{
        window.location.hash = 'register/' + hash.split('/')[1];
          console.log("this is sess during room load");
          console.log(sess);
      }
    }else{
      window.location.hash = 'index';
    }
/*    console.log('roomPath');
    console.log(roomPath);
    console.log('curpath');
    console.log(curpath);
    console.log(router);*/
/*    if(room == null && curpath != '/') {
      // window.location.assign('/');
      window.location.hash = 'index';
    }else if (roomPath != null && roomPath == null){
      window.location.assign('/room/' + room.room);
      console.log(roomPath);
    }*/

    Backbone.history.start();
  };

  return {
    initialize: initialize
  };
});
