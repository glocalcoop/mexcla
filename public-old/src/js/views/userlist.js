define(['MexclaView', 'text!templates/userlist.html', 'models/User', 'models/RoomCollection' ],
       function(MexclaView, userlistTemplate, User, RoomCollection) {
  var userlistView = MexclaView.extend({
    tagName: 'li',
    template: _.template(userlistTemplate),
    render: function(user) {
      console.log("from views/userlist.js this first");
      console.log(user.get('username'));
/*      var data = { 'users': 'ross' };
      var tmpl = _.template("<%= users =%>");
      $(this.el).html(tmpl(data));
      return this;*/
      // var tmpl = _.template("<%= users =%>");
      // this.$el.html(tmpl,this.model.toJSON());
      // var model = this.model.fetch();

      // this.$el.html(this.template({'users': 'ross'}));
      // this.$el.html(this.template(user));
/*      var roomCollection = new RoomCollection();
      // roomCollection.url = '/rooms/24/users';
      roomCollection.fetch();
      console.log("roomCollection");
      console.log(roomCollection);
      console.log(roomCollection.length);
      var that = this;
      roomCollection.on('sync', function() {
        console.log(roomCollection);
        roomCollection.each( function(model) {
          console.log("models in sync function");
          console.log(model);
          that.$el.html(userlistTemplate, model.toJSON());
          // return that;
        });
      });*/
      // console.log(roomCollection);
      // console.log(RoomCollection().fetch());
      // this.$el.html(this.template({'users': Users.get('users').toJSON()}));
      // $(this.el).html(_.template(userlistTemplate,this.model.toJSON()));
      $(this.el).html(_.template(userlistTemplate)({ 'username': user.get('username')}));

      // var template = _.template(usersTemplate);
      // $(this.el).append(template({users: "ross"});
      console.log("from views/userlist.js this");
      console.log(this);
      return this;
    }
  });
  console.log("UserlistView");
  console.log(userlistView);
  return userlistView;
});
