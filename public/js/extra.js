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
  });
};

function switch_language(lang) {
  update_language(lang);
  var match = window.location.hash.match(/\#room\/[0-9]+/i);
  window.location = 'http://' + window.location.hostname + ':8080/' + match[0] + '/' + lang;
};

console.log("this is window hash from extra.js");
console.log(window.location.hash);
$(window).unload(function() {
  var hash = window.location.hash;
  var match = hash.match(/\#room\/[0-9]+/i);
  if(null != match) {
    remove_user();
  }
  // console.log("this is closing");
  //alert("trying again");
});

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
