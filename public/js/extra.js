$(document).ready(function() {
  $.ajax("/session", {
    method: "GET",
    success: function(result) {
      console.log("session callback");
      console.log(result);
/*      if(!result.name) {
        $('a[rel="ajax:modal"]').trigger('click');
      }*/
    },
    error: function() {
      console.log("session callback");
      console.log(callback);
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
});

function check_session() {
  $.ajax("/session", {
    method: "GET",
    success: function(result) {
      console.log("session callback");
      console.log(result);
      if(!result.username) {
        $('a[rel="ajax:modal"]').trigger('click');
      }
    },
    error: function() {
      console.log("session callback");
      console.log(callback);
      }
  });
}

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
