$(document).ready(function() {
  // window.setTimeout(function() {
  $.ajax("/session", {
    method: "GET",
    success: function(result) {
      // console.log("session callback");
      // console.log(result);
/*      if(!result.name) {
        $('a[rel="ajax:modal"]').trigger('click');
      }*/
    },
    error: function() {
      // console.log("session callback");
      // console.log(callback);
      }
  });
  $('a[rel="ajax:modal"]').click(function() {

    $.ajax({

      url: $(this).attr('href'),

      success: function(newHTML, textStatus, jqXHR) {
        $(newHTML).appendTo('body').modal();
      },

      error: function(jqXHR, textStatus, errorThrown) {
        // Handle AJAX errors
      }

      // More AJAX customization goes here.

    });

    return false;
  });
  check_session();
  //}, 1000);
});

function check_session() {
  $.ajax("/check-user", {
    method: "GET",
    success: function(result) {
      console.log("check-user callback");
      console.log(result);
      if(!result.username) {
        $('a[rel="ajax:modal"]').click(function(event) {
          event.preventDefault();
/*          $('#user-name-form').submit(function(newEvent) {
            alert("handler for submit called");
            newEvent.preventDefault();
            return false;
          });*/
        });
        $('a[rel="ajax:modal"]').trigger('click');
      }
    },
    error: function() {
      console.log("session callback");
      console.log(callback);
      }
  });
  return false;
};

function remove_user() {
  $.ajax("/remove", {
    method: "GET",
    success: function(result) {
      console.log("User removed");
      // window.location.replace('http://localhost:8080');

    },
    error: function() {
      console.log("User not removed");
    }
  });
};

function build_modal() {
  $.ajax("/session", {
    method: "GET",
    success: function(result) {
      // console.log("session callback");
      // console.log(result);
/*      if(!result.name) {
        $('a[rel="ajax:modal"]').trigger('click');
      }*/
    },
    error: function() {
      // console.log("session callback");
      // console.log(callback);
      }
  });
  $('a[rel="ajax:modal"]').click(function() {

    $.ajax({

      url: $(this).attr('href'),

      success: function(newHTML, textStatus, jqXHR) {
        $(newHTML).appendTo('body').modal();
      },

      error: function(jqXHR, textStatus, errorThrown) {
        // Handle AJAX errors
      }

      // More AJAX customization goes here.

    });

    return false;
  });
  check_session();
};

function update_language(lang) {
  $.get("/lang/:" + lang, function( data ) {
    $( ".result").html( data );
  })
  .done(function() {
    var match = window.location.hash.match(/\#room\/[0-9]+/i);
    // if(!match) {
      window.location = 'http://' + window.location.hostname + ':8080/' + window.location.hash + '/' + lang;
      window.location.reload();
    // }
  });
};

function switch_language(lang) {
  update_language(lang);
  console.log("switch_language");
  console.log(lang);
  var match = window.location.hash.match(/\#room\/[0-9]+/i);
  if(match) {
    window.location = 'http://' + window.location.hostname + ':8080/' + match[0] + '/' + lang;
    // window.location.reload();
  }else{
    // window.location = 'http://' + window.location.hostname + ':8080/' + window.location.hash;
    // setTimeout(window.location.reload(), 500);
    // window.location.reload();
  }
};
$(window).on('beforeunload', function() {
    // return 'Your own message goes here...';
  // remove_user();
  var hash = window.location.hash;
  var match = hash.match(/\#room\/[0-9]+\/[en|es]/i);
  if(null != match) {
    remove_user();
  }
  console.log("match");
  console.log(match.input);
  // remove_user();
  return "some text";
});

/*$(window).unload(function() {
  var hash = window.location.hash;
  var match = hash.match(/\#room\/[0-9]+/i);
  if(null != match) {
    remove_user();
  }
  // console.log("this is closing");
  //alert("trying again");
});*/

/*$(function() {
    $('#user-name-form').submit(function(event) {
        event.preventDefault(); // Stops browser from navigating away from page
        var data;
        // build a json object or do something with the form, store in data
        $.post('/addEntry', data, function(resp) {
            alert(resp);
            // do something when it was successful
        });
    });
});*/
