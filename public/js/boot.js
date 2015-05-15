console.log('boot starting');
require.config({
  paths: {
    jQuery: '/js/libs/jquery',
    jquerymodal: '/js/libs/jquery.modal',
    Underscore: '/js/libs/underscore',
    Backbone: '/js/libs/backbone',
    text: '/js/libs/text',
    jssip: '/js/jssip-0.6.18',
    mexclajs: '/js/mexcla-html5',
    extra: '/js/extra',
    templates: '../templates'
},
  shim: {
    'Backbone': ['Underscore', 'jQuery'],
    'jquerymodal': ['Backbone'],
    'extra': ['jquerymodal'],
    'Mexcla': ['Backbone', 'jquerymodal', 'extra', 'mexclajs']
  }
});
console.log('boot.js initialized.');
require(['Mexcla'], function(Mexcla) {
  Mexcla.initialize();
});

