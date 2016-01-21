var app = {};
var Views = {};
var Models = {};


var websiteText = {
    en: {
      username: "Enter Name",
      your_name: "Your name",
      enter: "Enter",
      connect: "Connect",
      conference: "Conference Room",
      mute: "Mute",
      unmute: "Unmute",
      original: "Hear original language",
      interpretation: "Hear Interpretation",
      provide: "Provide Interpretation",
      participants: "Participant List",
      room: "Room",
      join: "Join a Room",
      enter: "Please enter the room number",
      create: "Create a Room",
      title: "Simultaneous Interpretation Conference System",
      salutation: "Hi",
      notepad: "Notepad",
      spreadsheet: "Spreadsheet",
      chat: "Chat"
    },
    es: {
      username: "Ingrese su nombre",
      your_name: "Su nombre",
      enter: "Ingrese",
      connect: "Connectarse",
      conference: "Sala De Conferencias",
      mute: "Mícrófono innactivo",
      unmute: "Activar micrófono",
      original: "Escuchar en idioma original",
      interpretation: "Escuchar la interpretación",
      provide: "Proporcionar interpretación",
      participants: "Lista de participantes",
      room: "Sala",
      join: "Entrar en una sala",
      enter: "Por favor, ingrese el número de la habitación",
      create: "Crear una sala",
      title: "Sistema de Conferencia Interpretación simultánea",
      salutation: "Hola",
      notepad: "Notepad",
      spreadsheet: "Spreadsheet",
      chat: "Chat"
    }
};

Models.User = Backbone.Model.extend({
  idAttribute: "_id",
  urlRoot: "/users"
});

Models.Room = Backbone.Model.extend({
  idAttribute: "_id",
  fetchByNum: function() {
    var that = this;
    $.ajax({
      type: 'GET',
      url: '/room/' + this.attributes.roomnum
    }).done(function(room){
      that.set(room);
    });
    return this;
  }
});

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

// View where user can join a room or create a new one
// it renders language according to app.user.attributes.lang
// and re-renders when user model language changes
Views.IndexView = Backbone.View.extend({
  el: $('#content'),
  template: _.template($("#index-template").html()),
  initialize: function() {
      this.setLang();
      // watch for changes
      this.listenTo(app.user, 'change:lang', function(){
        this.setLang();
        this.render();
      });
      this.render();
  },
  render: function () {
    this.$el.html(this.template(websiteText[this.lang]));
    new Views.WelcomeText({model: app.user});
    // click on new room button trigger ajax request to create room, creates model, and then navigates to: /room/:roomnum 
    this.$('#create-new-room-button').click(function(e){
      Views.createRoomAjax().done(function(room){
        app.room = new Models.Room(room);
        app.router.navigate('room/' + room.roomnum, {trigger: true});
      }); 
    });
    // Join Room Button
    this.$('#room-number-button').click(function(e){
      var roomnum = $('#room-number').val();
      app.router.navigate('room/' + roomnum, {trigger: true});
    });
    
    return this;
  },
  setLang: function() {
    // fallback to English if lang is missing
    this.lang = (_.isUndefined(app.user.attributes.lang)) ? 'en' : app.user.attributes.lang;
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

Views.Register = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#register-template').html()),
  render: function() {
    var that = this;
    this.$el.html(this.template());
    this.$('#register-submit-button').click(function(e){
      var username =  that.$('#user-name').val();
      var lang = that.$('#lang-select').val();
      Views.createUserAjax(username,lang).done(function(user){
        // create user model
        app.user = new Models.User(user);
        // follow router back to homepage
        // the Ajax response creates a cookie, so this time the homepage will not show the register page
        app.router.navigate("#/", {triggennr: true});
      });
    });
    return this;
  }
});

// unlike the other Views, this one is appended to #content instead of replacing it
Views.RoomSidebar = Backbone.View.extend({
  el: $('#content'),
  template: _.template($('#room-sidebar-template').html()),
  render: function() {
    this.$el.append(this.template(websiteText[app.user.attributes.lang]));
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
    return this;
  },
  initialize: function() {
    this.lang = app.user.attributes.lang;
    this.listenTo(app.user, 'change:lang', function(){
      this.lang = app.user.attributes.lang;
      this.render();
    });
    this.sidebar = new Views.RoomSidebar();
  }
});

var MexclaRouter = Backbone.Router.extend({
  routes: {
    "": "index",
    "room/:roomnum": "room",
    "*page": "default"
  },

  index: function() {
    if (_.isUndefined(Cookies.get('id'))) {
      // show register page
      var register = new Views.Register().render();
    } else {
      this.makeUserIfNeeded();
      // log in to homepage
      app.homepage = new Views.IndexView();
    }
  },
  room: function(roomnum) {
    this.makeUserIfNeeded();
    if (_.isUndefined(app.room)) {
      app.room = new Models.Room({roomnum: roomnum}).fetchByNum();
    }
    app.roomView = new Views.Room({model: app.room}).render();
  },
  default: function() {
    // this route will be executed if no other route is matched.
  },
  makeUserIfNeeded: function() {
    // if user is undefined, which would happen when someone returns to the page and has a cookie stored, then it's a new session and we need to create the user object.
    if (_.isUndefined(app.user)){
      var userid = Cookies.get('id');
      var lang = Cookies.get('lang');
      if (_.isUndefined(userid)) {
        // if no cookies send back to register
        app.router.navigate("#/", {trigger: true});
      } else {
        // create user and fetch details
        app.user = new Models.User({_id: userid, lang: lang});
        app.user.fetch();
      }
    }
  }
});

app.router = new MexclaRouter();

Backbone.history.start(); // must call this to start router
