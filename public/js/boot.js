console.log('boot starting');
require.config({
  paths: {
    jQuery: '/js/libs/jquery',
    Underscore: '/js/libs/underscore',
    Backbone: '/js/libs/backbone',
    text: '/js/libs/text',
    jssip: '/js/jssip-0.6.18',
    mexclajs: '/js/mexcla-html5',
    templates: '../templates'
},
  shim: {
    'Backbone': ['Underscore', 'jQuery'],
    'Mexcla': ['Backbone', 'mexclajs']
  }
});
console.log('boot.js initialized.');
require(['Mexcla'], function(Mexcla) {
  Mexcla.initialize();
});
