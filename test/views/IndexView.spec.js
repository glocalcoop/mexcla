describe('IndexView', function(){
  
  describe('initalize()', function(){
    it('calls setLang, listenTo, and render',function(){
      app.user = 'user';
      sinon.stub(Views.IndexView.prototype, "setLang");
      sinon.stub(Views.IndexView.prototype, "render");
      sinon.stub(Views.IndexView.prototype, "listenTo");

      var indexView = new Views.IndexView();

      indexView.setLang.calledOnce.should.eql(true);
      indexView.render.calledOnce.should.eql(true);
      indexView.listenTo.calledOnce.should.eql(true);
      indexView.listenTo.args[0][0].should.eql('user');
      indexView.listenTo.args[0][1].should.eql('change:lang');
      indexView.listenTo.args[0][2].should.be.a('Function');
      
      Views.IndexView.prototype.setLang.restore();
      Views.IndexView.prototype.render.restore();
      Views.IndexView.prototype.listenTo.restore();
    });
  });

  describe('setLang()', function(){

    before(function(){
      sinon.stub(Views.IndexView.prototype, "initialize");
      
    });
    after(function(){
      app.user = null;
      Views.IndexView.prototype.initialize.restore();
    });

    it('sets lang to be user\'s lang', function(){
      app.user = new Models.User({lang:'de'});
      var indexView = new Views.IndexView();
      should.not.exist(indexView.lang);
      indexView.setLang();
      indexView.lang.should.eql('de');
    });

    it('sets english by default',function(){
      app.user = new Models.User();
      var indexView = new Views.IndexView();
      indexView.setLang();
      indexView.lang.should.eql('en');
    });
  });

  describe('switchLang()',function(){
    it('adds handlers to "#language-links a"');
    it('click changes user\'s language');
  });

  describe('createRoom()', function(){
    var indexView;
    var createRoomAjax;
    var stubDone;

    before(function(){
      stubDone = sinon.stub().callsArgWith(0, {roomnum: 666});
      createRoomAjax = sinon.stub(Views, 'createRoomAjax').returns({done: stubDone});
      
      app.router = {};
      app.router.navigate = sinon.spy();
      sinon.stub(Views.IndexView.prototype, "initialize");

      indexView = new Views.IndexView();
      indexView.createRoom(false);
    });

    after(function(){
      createRoomAjax.restore();
      Views.IndexView.prototype.initialize.restore();
      app.router = {};
    });
    
    it('calls createRoomAjax', function(){
      createRoomAjax.calledOnce.should.eql(true);
      createRoomAjax.args[0][0].should.eql(false);
    });

    it('if createRoomAjax is sucuessful, it creates new room', function(){
      stubDone.calledOnce.should.eql(true);
      app.room.should.be.instanceOf(Models.Room);
      app.room.get('roomnum').should.eql(666);
    });

    it('naviates to room/roomnumber', function(){
      app.router.navigate.calledOnce.should.eql(true);
      app.router.navigate.args[0][0].should.eql('room/666');
      app.router.navigate.args[0][1].should.eql({trigger: true});
    });
    
  });
});
