Models.User = Backbone.Model.extend({
  idAttribute: "_id",
  urlRoot: "/users"
});

Models.Room = Backbone.Model.extend({
  idAttribute: "_id",
  fetchByNum: function() {
    $.ajax({
      type: 'GET',
      url: '/room/' + this.attributes.roomnum
    }).done(function(room){
      console.log('fetch by num returns');
      console.log(room);
      this.set(room);
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
