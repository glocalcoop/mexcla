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
});
