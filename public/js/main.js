var app = {};
var Views = {};
var Models = {};


var websiteText = {
    en: {
      title: "Simultaneous Interpretation Conference System",
      welcome: "Welcome to Mexcla",
      subhead: "Mexcla is the Simultaneous Interpretation Conference System",
      salutation: "Hi",
      register: "Please Register",
      username: "Enter Name",
      your_name: "Your Name",
      select_language: "Select Your Language",
      enter: "Enter",
      connect: "Connect",
      conference: "Conference",
      link: "Link",
      original: "Hear Original Language",
      interpretation: "Hear Interpretation",
      provide: "Provide Interpretation",
      participants: "Participant List",
      room: "Room",
      join: "Join a Room",
      enter: "Please Enter the Room Number",
      create: "Create a Room",
      room_options: "Room Options",
      private_room: "Private Room",
      moderated_room: "Moderated Room",
      notepad: "Notepad",
      spreadsheet: "Spreadsheet",
      chat: "Chat",
      channels: "Language Channels",
      add_channel: "Add a Channel",
      channel_language: "Channel Language",
      channel_abbreviation: "Language Abbreviation",
      interpret: "Interpret",
      join_channel: "Join",
      leave_channel: "Leave",
      moderator: "Moderator",
      queued: "Queued",
      mute: "Mute",
      unmute: "Unmute",
      raise_hand: "Raise Hand",
      lower_hand: "Lower Hand",
      click_copy: "Click to Copy"
    },
    es: {
      title: "Sistema de Conferencia Interpretación Simultánea",
      welcome: "Bienvenido a Mexcla",
      subhead: "Mexcla es el Sistema de Conferencia Interpretación Simultánea",
      salutation: "Hola",
      register: "Please Register",
      username: "Ingrese su Nombre",
      your_name: "Su Nombre",
      select_language: "Select Your Language",
      enter: "Ingrese",
      connect: "Connectarse",
      conference: "Sala De Conferencias",
      link: "Hipervínculo",
      original: "Escuchar en Idioma Original",
      interpretation: "Escuchar la interpretación",
      provide: "Proporcionar interpretación",
      participants: "Lista de Participantes",
      room: "Sala",
      join: "Entrar en una Sala",
      enter: "Por Favor, Ingrese el Número de la Habitación",
      create: "Crear una Sala",
      room_options: "Room Options",
      private_room: "Private Room",
      moderated_room: "Moderated Room",
      notepad: "Añadir Notas",
      spreadsheet: "Spreadsheet",
      chat: "Añadir el Chat",
      channels: "Language Channels",
      add_channel: "Add a Channel",
      channel_language: "Channel Language",
      channel_abbreviation: "Language Abbreviation",
      interpret: "Interpret",
      join_channel: "Join",
      leave_channel: "Leave",
      moderator: "Moderator",
      queued: "Queued",
      mute: "Mícrófono Innactivo",
      unmute: "Activar Micrófono",
      raise_hand: "Raise Hand",
      lower_hand: "Lower Hand",
      click_copy: "Copia"

    }
};

Models.User = Backbone.Model.extend({
  idAttribute: "_id",
  urlRoot: "/users"
});

Models.Room = Backbone.Model.extend({
  idAttribute: "_id",
  urlRoot: "/room/id",
  initialize: function() {
    this.establishSocket();
  }, 
  fetchByNum: function() {
    var that = this;
    $.ajax({
      type: 'GET',
      url: '/room/' + this.attributes.roomnum
    }).done(function(room){
      that.set(room);
    });
    return this;
  },
  // channel (object) -> adds new channel to room;
  createChannel: function(channel) {
    var that = this;
    this.createChannelAjax(channel).done(function(res){
      if (that.serverErrorCheck(res)) {
        that.set(res);
      }
    });
    return this;
  },
  createChannelAjax: function(channel) {
    return $.ajax({
      type: 'POST',
      url: '/room/id/' + this.get('_id') + '/channel/create',
      data: channel
    });
  },
  // string, string -> changes interpreter of channel
  addInterpreterToChannel: function(interpreter, channelid) {
    var that = this;
    var channels = this.get('channels');
    var updatedChannels = _.map(channels, function(channel){
      if (channel._id === channelid) {
        channel.interpreter = interpreter;
        that.updateChannelAjax(channel).done(function(channel){
          // callback...could check for errors here
          // console.log(channel);
        });
        return channel;
      } else {
        return channel;
      }
    });
    this.set('channels', updatedChannels); // updated before server...should eventually ensure it is saved to the db
    return this;
  },
  // given a channel (object) it updates the db/server with any of the changed priorities
  updateChannelAjax: function(channel) {
    var channelID = channel._id;
    var channelData = _.omit(channel, '_id');
    return $.ajax({
        type: 'POST',
        url: '/room/id/' + this.get('_id') + '/channel/' + channelID + '/update',
        data: channelData
    });
  },
  serverErrorCheck: function(res) {
    if (_.has(res, 'error')) {
      alert(res.error);
      return false;
    } else {
      return true;
    }
  },
  establishSocket: function() {
    var that = this;
    var roomnum = this.get('roomnum');
    this.socket = io('/' + roomnum);
    this.socket.on('room update', function(room){
      that.set(room);
    });
  }
});

/*

{
  lang: '' // 'en', 'es'
  users; [{users}]
  interpreter: user,
}


*/

/*
USERS

{
 username: ''
 currentRoom: null or ObjectId
 lang: ''
 admin: boolean
 _id: 
}

ROOM
room-template
room-sidebar-template
{
conference
roomNum
room
mute
unmute
original
interpretation
provide
Notepad 
Spreadsheet
IRC chat
participants

 }



*/

// input: string, string ('en' or 'es')
// output: jqXHR-promise
Views.createUserAjax = function (username, lang) {
  return $.ajax({
    type: 'POST',
    url: '/users/new',
    data: {
      username: username,
      lang: lang
    }
  });
};

Views.createRoomAjax = function() {
  return $.ajax({
    type: 'GET',
    url: '/room/create'
  });
};

Views.isThereAUser = function() {
  if (_.isUndefined(Cookies.get('id'))) {
    return false;
  } else {
    return true;
  }
};

Views.isModerator = function() {
  return app.user.id == app.room.get('moderator');
}

Views.isCurrentUser = function(userId) {
  return app.user.id == userId;
}

Views.RegisterModal = Backbone.View.extend({
  initialize: function() {
  },
  render: function(afterwards) {
    $('#register-modal').modal("show");
    $('#register-submit-button').click(function(){
      var username = $('#register-modal #user-name').val();
      var lang = $('#register-modal  #lang-select').val();
      Views.createUserAjax(username, lang).done(function(user){
        app.user.set(user);
        // $('#register-modal').modal('hide') -> doesn't appear to work.
        // the focus is messed up...i'll just deal with it later and do this...
        $('#register-modal').hide();
        afterwards();
      });
    });
  }
});

// View: "main" page where user picks between creating a room or joining an existing one
// it renders language according to app.user.attributes.lang
// and re-renders when user model language changes
Views.IndexView = Backbone.View.extend({
  el: $('#content'),
  template: _.template($("#index-template").html()),
  initialize: function() {
      this.setLang();
      this.listenTo(app.user, 'change:lang', function(){
        this.setLang(); 
        this.render();
      });
      this.render();
  },
  render: function () {
    var that = this;
    this.$el.html(this.template(websiteText[this.lang]));
    this.welcomeText();
    this.$('#create-new-room-button').click(function(e){
      if (Views.isThereAUser()) {
        that.createRoom();
      } else {
        new Views.RegisterModal().render(that.createRoom);
      }
    });
    this.$('#room-number-button').click(function(e){
      if (Views.isThereAUser()) {
        that.JoinRoom()(); // ()() is not a typo...JoinRoom returns a function.
      } else {
        new Views.RegisterModal().render(that.JoinRoom());
      }
    });
    return this;
  },
  setLang: function() {
    // fallback to English if lang is missing
    this.lang = (_.isUndefined(app.user.attributes.lang)) ? 'en' : app.user.attributes.lang;
  },
  createRoom: function() {
    Views.createRoomAjax().done(function(room){
      app.room = new Models.Room(room);
      app.router.navigate('room/' + room.roomnum, {trigger: true});
    }); 
  },
  JoinRoom: function() {
    var roomnum = $('#room-number').val();
    return function() {
      app.router.navigate('room/' + roomnum, {trigger: true});
    };
  },
  welcomeText: function() {
    if (!_.isUndefined(app.user)) {
      new Views.WelcomeText({model: app.user});
    }
  }
});

// use: new WelcomeText({model: app.user})
Views.WelcomeText = Backbone.View.extend({
  el: $('#welcome-text'),
  template: _.template($('#welcome-text-template').html()),
  render: function() {
    var lang = (_.isUndefined(this.model.attributes.lang)) ? 'en' : this.model.attributes.lang;
    var welcomeText = {
      greetings: websiteText[lang].salutation + ", ",
      username: (_.isUndefined(this.model.attributes.username)) ? '' : this.model.attributes.username
    };
    this.$el.html(this.template(welcomeText));
    return this;
  },
  initialize: function() {
    this.render();
    // listen to changes to lang and name
    this.listenTo(this.model, 'change:lang', this.render);
    this.listenTo(this.model, 'change:username', this.render);
  }
});

// unlike the other Views, this one is appended to #content instead of replacing it
// use; new Views.RoomSidebar({model: app.room});
Views.RoomSidebar = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#room-sidebar-template').html()),
  initialize: function() {
    this.listenTo(this.model, "change:users", this.renderParticipants);
  },
  render: function() {
    this.$el.append(this.template(websiteText[app.user.attributes.lang]));
    this.renderParticipants();
    return this;
  },
  renderParticipants: function() {
    var selector = '#participants';
    $(selector).html('');
    _.each(this.model.attributes.users, function(user){
      var participantRow = _.template($('#participant-row-template').html());
      $(selector).append(participantRow(user));

      if(Views.isModerator()) {
        var moderatorEl = $('#' + user._id + ' .moderator-controls');
        new Views.ModeratorControls({el: moderatorEl}).render();
      }

    });
    return this;
  }
});


// use: new Views.Room({model: app.room})
Views.Room = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#room-template').html()),
  render: function() {
    var templateData = _.extend(websiteText[this.lang], this.model.attributes);
    this.$el.html(this.template(templateData));
    this.sidebar.render();
    this.renderChannel();
    if (this.isModerator) {
      this.renderControls();
    }
    return this;
  },
  initialize: function() {
    this.lang = app.user.attributes.lang;
    this.listenTo(app.user, 'change:lang', function(){
      this.lang = app.user.attributes.lang;
      this.render();
    });
    this.sidebar = new Views.RoomSidebar({model: app.room});
    this.listenTo(this.model, 'change:channels', this.renderChannel);
  },
  renderChannel: function() {
    var channels = this.model.get('channels');
    if (!_.isEmpty(channels)) {
      _.each(channels, function(channel){
        // display channel
        new Views.Channel({});
      });
    }
    return this;
  },
  renderControls: function() {
  
  }
});

// TODO: turn channel html into template
// but for now:
$(document).ready(function(){
  $('#add-channel-button').click(function(){
    new Views.AddChannelModal({model: app.room}).render();
  });
});


Views.Channel = Backbone.View.extend({
  
});

Views.ChannelOptions = Backbone.View.extend({
  // where we will provide the options to modify a channel: add interpreter, join, leave, delete, etc.
});

Views.ModeratorControls = Backbone.View.extend({
  // Might need to change to use class, if not unique on page
  // el: $('.moderator-controls');
  template: _.template($('#moderator-controls-template').html()),
  render: function() {
    this.$el.html(this.template({}));
  }
});

Views.CurrentUserControls = Backbone.View.extend({
  // Might need to change to use class, if not unique on page
  // el: $('.current-user-control');
});

Views.MuteControls = Backbone.View.extend({
  // Might need to change to use class, if not unique on page
  // el: $('.mute-controls');
});


// use new Views.AddChannelModal({model: app.room})
Views.AddChannelModal = Backbone.View.extend({
  initialize: function() {
    new Views.ChannelTranslatorOptionsList({model: app.room});
  },
  render: function() {
    $('#channel-modal').modal("show");
    $('#channel-submit-button').click(function(e){
      var lang = $('#channel-lang-select').val();
      var translator = $('#channel-translator-options').val();
      // this.model.createChannel({'lang': lang, 'translator': translator});
    });
  }
});

Views.ChannelTranslatorOptionsList = Backbone.View.extend({
  el: $('#channel-modal #channel-translator-options'),
  template: _.template('<option><%= username %></option>'),
  initialize: function() {
    this.render();
  },
  render: function(){
    var that = this;
    // TODO: have value be id of user
    var html = '<option value="">Select a translator</option><option value="none">none</option>';
    this.$el.html(html);
    var users = this.model.get('users');
    _.each(users, function(user){
       that.$el.append(that.template(user));
    });
  }
});

var MexclaRouter = Backbone.Router.extend({
  routes: {
    "": "index",
    "room/:roomnum": "room",
    "*page": "default"
  },

  index: function() {
    this.syncUser();
    // log in to homepage
    app.homepage = new Views.IndexView();
  },
  room: function(roomnum) {
    this.syncUser();
    if (_.isUndefined(app.room)) {
      app.room = new Models.Room({roomnum: roomnum}).fetchByNum();
    }
    app.roomView = new Views.Room({model: app.room}).render();
  },
  default: function() {
    // this route will be executed if no other route is matched.
  },
  syncUser: function() {
    // if user is undefined, which would happen when someone returns to the page and has a cookie stored, then it's a new session and we need to create the user object.
      var userid = Cookies.get('id');
      var lang = Cookies.get('lang');
      if (!_.isUndefined(userid)) {
        // set user
        app.user.set('_id', userid);
        if (!_.isUndefined(lang)) {
          app.user.set('lang', lang);
        }
        app.user.fetch();
      }
  }
});

app.router = new MexclaRouter();
app.user = new Models.User();

Backbone.history.start(); // must call this to start router

/**
 * UI Functions
 */

$(function() {

    /**
     * Call Mute and Unmute
     */
    $('#mic-mute').change(function() {
        if( $(this).prop('checked') ) {

            mexcla_mic_unmute();

        } else {
            mexcla_mic_mute(); 
        }
     
    })

    /**
     * Collaboration
     * Load collaboration iframes when tab is clicked
     */
    $('#collaboration a[data-toggle="tab"]').click(function(event) {

        event.preventDefault();

        $(this).tab('show');

        var panelId = $(event.target).attr('href');

        var src = $(panelId).attr('data-src');
        // if the iframe hasn't already been loaded once
        if($(panelId + ' iframe').attr('src')=='') {
            $(panelId + ' iframe').attr('src',src);
        }

    });


    /**
     * Activate Bootstrap tooltips
     * This isn't working for dynamic elements
     */
    $.when.apply($, Views.RoomSidebar).done(function() {
        $('[data-toggle="tooltip"]').tooltip();
    });

    /**
     * Activate Clipboard
     */
    new Clipboard('.copy-link');

    $('.copy-link').click(function() {

        $(this).toggleClass( "cursor-grabbling" );

    });

});


/**
 * Collaboration Functions
 */

 // var roomnum = app.room.attributes._id;

 // var collabTools = {
 //    notepad: 'https://pad.riseup.net/p/' + roomnum + '?showChat=false',
 //    spreadsheet: 'https://calc.mayfirst.org/' + roomnum, 
 //    chat: 'https://irc.koumbit.net/?channels=#' + roomnum + '&nick=guest'
 // }
