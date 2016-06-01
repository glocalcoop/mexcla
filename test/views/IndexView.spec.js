describe('IndexView', function(){
  
  describe('initialize()', function(){
    before(function(){
      app.user = 'user';
      sinon.stub(Views.IndexView.prototype, "setLang");
      sinon.stub(Views.IndexView.prototype, "render");
      sinon.stub(Views.IndexView.prototype, "listenTo");
    });
    
    after(function(){
      Views.IndexView.prototype.setLang.restore();
      Views.IndexView.prototype.render.restore();
      Views.IndexView.prototype.listenTo.restore();
    });

    it('calls setLang, listenTo, and render',function(){
      var indexView = new Views.IndexView();

      indexView.setLang.calledOnce.should.eql(true);
      indexView.render.calledOnce.should.eql(true);
      indexView.listenTo.calledOnce.should.eql(true);
      indexView.listenTo.args[0][0].should.eql('user');
      indexView.listenTo.args[0][1].should.eql('change:lang');
      indexView.listenTo.args[0][2].should.be.a('Function');
    
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

    it('sets IndewView.lang to be user\'s lang', function(){
      app.user = new Models.User({lang:'de'});
      var indexView = new Views.IndexView();
      should.not.exist(indexView.lang);
      indexView.setLang();
      indexView.lang.should.eql('de');
    });

    it('has english as the default',function(){
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

    it('if createRoomAjax is successful, it creates new room', function(){
      stubDone.calledOnce.should.eql(true);
      app.room.should.be.instanceOf(Models.Room);
      app.room.get('roomnum').should.eql(666);
    });

    it('navigates to room/roomnumber', function(){
      app.router.navigate.calledOnce.should.eql(true);
      app.router.navigate.args[0][0].should.eql('room/666');
      app.router.navigate.args[0][1].should.eql({trigger: true});
    });
    
  });

  describe('joinRoom()', function(){
    before(function(){
      sinon.stub(Views.IndexView.prototype, "initialize");
      sinon.stub($.fn, 'val').returns(666);
      app.router.navigate = sinon.spy();
    });
    after(function(){
      Views.IndexView.prototype.initialize.restore();
      $.fn.val.restore();
      app.router = {};
    });
    
    it('returns a function', function(){
      (new Views.IndexView().joinRoom()).should.be.a('Function');
    });

    it('returned function navigates to room/roomnum', function(){
      new Views.IndexView().joinRoom()();
      app.router.navigate.calledOnce.should.eql(true);
      app.router.navigate.args[0][0].should.eql('room/666');
      app.router.navigate.args[0][1].should.eql({trigger: true});
    });
  });

  describe('render()', function(){

    before(function(){
      sinon.stub(Views.IndexView.prototype, "initialize");
    });

    after(function(){
      Views.IndexView.prototype.initialize.restore();
    });
    
    it('renders template html', function(){
      var indexView = getIndexView();
      indexView.render();
      
      indexView.$el.html().should.not.eql('');
      indexView.$el.find('main').should.have.length(1);
      indexView.$el.find('fieldset').should.have.length(2);
    });

    it('calls switchLang', function(){
      var indexView = getIndexView();
      var spy = sinon.spy(indexView, 'switchLang');
      indexView.render();
      sinon.assert.calledOnce(spy);
    });


    it('creates new WelcomeText & BrandingText if there is a user', function(){
      var WelcomeText = sinon.spy(Views, 'WelcomeText');
      var BrandingText = sinon.spy(Views, 'BrandingText');
      
      var indexView = getIndexView();
      app.user = new Models.User();
      indexView.render();
      
      sinon.assert.calledOnce(WelcomeText);
      sinon.assert.calledOnce(BrandingText);
      
      WelcomeText.restore();
      BrandingText.restore();
      
    });

    it('does not create new WelcomeText & BrandingText when app.user is undefined', function(){
      var WelcomeText = sinon.spy(Views, 'WelcomeText');
      var BrandingText = sinon.spy(Views, 'BrandingText');
      
      var indexView = getIndexView();
      app.user = undefined;
      indexView.render();

      sinon.assert.notCalled(WelcomeText);
      sinon.assert.notCalled(BrandingText);

      app.user = null;
      indexView.render();

      sinon.assert.notCalled(WelcomeText);
      sinon.assert.notCalled(BrandingText);

      WelcomeText.restore();
      BrandingText.restore();
    });

    it('adds click handlers to #create-new-room-button & #room-number-button' , function(){
      var indexView = getIndexView();
      var handler1 = sinon.spy(indexView, 'createNewRoomClickHandler');
      var handler2 = sinon.spy(indexView, 'roomNumberButtonHandler');

      indexView.render();
      sinon.assert.calledOnce(handler1);
      sinon.assert.calledOnce(handler2);
      
    });
  });

  describe('click handlers: ', function(){
    before(function(){
      sinon.stub(Views.IndexView.prototype, "initialize");
    });

    after(function(){
      Views.IndexView.prototype.initialize.restore();
    });
    
    describe('createNewRoomClickHandler()',function(){
      
      it('returns a function', function(){
        getIndexView().createNewRoomClickHandler().should.be.a('Function');
      });

      it('calls createRoom when there is a user', function(){
        sinon.stub(Views, 'isThereAUser').returns(true);
        var indexView = getIndexView();
        var createRoomSpy = sinon.spy(indexView, 'createRoom');
        indexView.createNewRoomClickHandler()();
        createRoomSpy.calledOnce.should.eql(true);
        Views.isThereAUser.restore();
      });

      it('calls RegisterModal with wrappedVersion of Create room when there is no user', function(){
        sinon.stub(Views, 'isThereAUser').returns(false);
        var indexView = getIndexView();
        var renderSpy = sinon.spy();
        sinon.stub(Views, 'RegisterModal').returns({render: renderSpy});
        
        indexView.createNewRoomClickHandler()();
        
        Views.RegisterModal.calledOnce.should.eql(true);
        renderSpy.calledOnce.should.eql(true);
        renderSpy.args[0][0].should.be.a('Function');
        
        Views.RegisterModal.restore();
        Views.isThereAUser.restore();
      });
      
    });
    

    describe('roomNumberButtonHandler()',function(){
      it('returns a function', function(){
        getIndexView().roomNumberButtonHandler().should.be.a('Function');
      });

      it('calls joinRoom when there is a user',function(){
        sinon.stub(Views, 'isThereAUser').returns(true);
        var indexView = getIndexView();
        var joinRoomSpy = sinon.stub(indexView, 'joinRoom').returns(sinon.spy());
        indexView.roomNumberButtonHandler()();
        
        joinRoomSpy.calledOnce.should.eql(true);
        Views.isThereAUser.restore();
      });

      it('calls RegisterModal passing joinRoom to .render', function(){
        sinon.stub(Views, 'isThereAUser').returns(false);
        var indexView = getIndexView();
        var renderSpy = sinon.spy();
        sinon.stub(Views, 'RegisterModal').returns({render: renderSpy});
        
        indexView.roomNumberButtonHandler()();
        
        Views.RegisterModal.calledOnce.should.eql(true);
        renderSpy.calledOnce.should.eql(true);
        renderSpy.args[0][0].should.be.a('Function');
        
        Views.RegisterModal.restore();
        Views.isThereAUser.restore();
      });
    });
  });
});


function getIndexView(){
  var indexView = new Views.IndexView({el: undefined});
  indexView.lang = 'en';
  return indexView;
}
