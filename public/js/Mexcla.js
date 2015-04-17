define(['router'], function(router) {
  var initialize = function() {
    runApplication();
  };

  var runApplication = function() {
    console.log('Mexcla.js initialized.');
    // window.location.hash = 'room';
    Backbone.history.start();
  };

  return {
    initialize: initialize
  };
});
