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

});
