describe('Views/util.js', function(){

  describe('Ajax requests', function(){

    beforeEach(function(){
      sinon.spy($, 'ajax');
    });

    afterEach(function(){
      $.ajax.restore();
    });

    describe('createUserAjax', function(){
      it('issues post request to /users/new', function(){
        Views.createUserAjax('alice', 'es');
        $.ajax.args[0][0].url.should.eql('/users/new');
        $.ajax.args[0][0].type.should.eql('POST');
        $.ajax.args[0][0].data.should.eql({username:'alice', lang:'es'});
      });
    });
    describe('createRoomAjax', function(){
      it('issues post request to /users/new', function(){
        Views.createRoomAjax(true);
        $.ajax.args[0][0].url.should.eql('/room/create');
        $.ajax.args[0][0].type.should.eql('GET');
        $.ajax.args[0][0].data.should.eql({moderated: true});
      });
    });


  });
  
  describe('isThereAUser()', function(){

    before(function(){
      sinon.stub(Cookies, 'get')
        .onFirstCall().returns('userid')
        .onSecondCall().returns(undefined);
    });

    after(function(){
      Cookies.get.restore();
    });
    
    it('returns true if there is an id cookie', function(){
      Views.isThereAUser().should.eql(true);
    });

    it('returns false if there is not an id cookie', function(){
      Views.isThereAUser().should.eql(false);
    });

  });

  describe('exists()',function(){
    it('returns true for anything except undefined and null',function(){
      Views.util.exists(undefined).should.eql(false);
      Views.util.exists(null).should.eql(false);
      Views.util.exists('something').should.eql(true);
      Views.util.exists('').should.eql(true);
      Views.util.exists({}).should.eql(true);
    });
  });

  describe('hasChannelInterpreter()', function(){
    before(function(){
      app.room = new Models.Room();
      app.room.set('channels', [{_id: '123', interpreter:'666'}]);
    });

    after(function(){
      app.room = null;
    });

    it('returns true if the channel has an interpreter', function(){
      Views.hasChannelInterpreter('123').should.eql(true);
    });
    it('returns false if the channel doesn\'t have an interpreter', function(){
      app.room.set('channels', [{_id: '123', interpreter:''}]);
      Views.hasChannelInterpreter('123').should.eql(false);
    });
  });
});
