Models.User = Backbone.Model.extend({
  idAttribute: "_id",
  urlRoot: "/users"
});

Models.Room = Backbone.Model.extend({
  idAttribute: "_id"
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
