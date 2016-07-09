describe('User', function(){

  before(function(){
    app.room = new Models.Room({_id: 123});
    sinon.spy($, "ajax");
  });

  after(function(){
    app.room = null;
    $.ajax.restore();
  });

  describe('raiseHand', function(){

    it('executes raise hand ajax call', function(){
      new Models.User().raiseHand();
      $.ajax.getCall(0).args[0].url.should.eql('/room/id/123/raisehand');
    });

  });

  describe('lowerHand', function(){

    it('executes lower hand ajax call', function(){
      new Models.User().lowerHand();
      $.ajax.getCall(1).args[0].url.should.eql('/room/id/123/lowerhand');
    });

  });

  describe('callOn', function(){

    it('executes call on ajax call', function(){
      new Models.User().callOn("personid");
      $.ajax.getCall(2).args[0].url.should.eql('/room/id/123/callon');
      $.ajax.getCall(2).args[0].data._id.should.eql('personid');
    });

  });

  describe('callOff', function(){
    it('executes call off ajax call', function(){
      new Models.User().callOff("personid");
      $.ajax.getCall(3).args[0].url.should.eql('/room/id/123/calloff');
      $.ajax.getCall(3).args[0].data._id.should.eql('personid');
    });
  });

  describe('isInAChannel', function(){
    
    before(function(){
      app.room.set('channels', [{"name":"some new channel","lang":"es","interpreter":"","_id":"d2e07268821","users":['666', '123', '456']}]);
    });
    
    it('returns the lang channel string of the channel if the user is in a channel', function(){
      var user = new Models.User({_id: '666'});
      user.isInAChannel().should.eql('es');
    });

    it('returns false if the user is not in any channels', function(){
      var user = new Models.User({_id: '011'});
      user.isInAChannel().should.eql(false);
    });
  });
  
  describe('isInterpreter', function(){

    before(function(){
      app.room = new Models.Room({_id: 123});
      app.room.set('channels', [{"name":"some new channel","lang":"es","interpreter":"789","_id":"1234456","users":['123', '456']}]);
    });

    it('returns true if user is interpreter', function(){
      var user = new Models.User({_id: '789'});
      user.isInterpreter('es').should.eql(true);
    });

    it('returns false if user is in channel but not an interpreter', function(){
      var user = new Models.User({_id: '123'});
      user.isInterpreter('es').should.eql(false);
    });

    it('returns false even if user in not in a channel', function(){
      var user = new Models.User({_id: '4'});
      user.isInterpreter('es').should.eql(false);
    });
    

  });

  describe('getStatus', function(){
    
    before(function(){
      app.room = new Models.Room({_id: 123});
      app.room.set('channels', [{"name":"some new channel","lang":"es","interpreter":"789","_id":"123456","users":['123', '456', '789']}]);
    });
    
    it('returns only main, interpret, or hear', function(){
      var user = new Models.User();
      user.getStatus().should.oneOf(['main', 'interpret', 'hear']);
    });

    it('returns main when user is in main room', function(){
      var user = new Models.User({_id: '666'});
      user.getStatus().should.equal('main');
    });

    it('returns interpret when user is the interpreter', function(){
      var user = new Models.User({_id: '789'});
      user.getStatus().should.equal('interpret');
    });
    
    it('returns hear when user is the language channel',function(){
      var user = new Models.User({_id: '123'});
      user.getStatus().should.equal('hear');
    });
  });

});
