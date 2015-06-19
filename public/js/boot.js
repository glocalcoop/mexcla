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
    templates: '../templates',
    MexclaView: '/js/MexclaView'
},
  shim: {
    'Backbone': ['Underscore', 'jQuery'],
    'jquerymodal': ['Backbone'],
    'extra': {deps: ['Backbone', 'jquerymodal']},
    'jssip': {deps: ['Backbone']},
    'mexclajs': {deps: ['jssip']},
    'Mexcla': ['Backbone', 'jquerymodal', 'config', 'jssip', 'extra', 'mexclajs']
  }
});
console.log('boot.js initialized.');
require(['Mexcla'], function(Mexcla) {
  Mexcla.initialize();
});
