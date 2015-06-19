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
    config: '/js/config',
    username: '/js/username-form',
    templates: '../templates',
    MexclaView: '/js/MexclaView'
},
  shim: {
    'Backbone': ['Underscore', 'jQuery'],
    'jquerymodal': ['Backbone'],
    'extra': {deps: ['Backbone', 'jquerymodal']},
    'username': { deps: ['extra']},
    'Mexcla': ['Backbone', 'jquerymodal', 'config', 'username', 'jssip', 'extra', 'mexclajs']
  }
});
console.log('boot.js initialized.');
require(['Mexcla'], function(Mexcla) {
  Mexcla.initialize();
});
