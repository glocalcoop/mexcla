describe.only('Audio', function(){
  describe('util.audio.freeswitchAction', function(){
    
    before(function(){
      sinon.spy($, "ajax");
      config.controller_url = 'fs.dev';
    });

    after(function(){
      $.ajax.restore();
    });
    
    it('sends correct ajax requests ', function(){
      Models.util.audio.freeswitchAction('1234', 'update');
      Models.util.audio.freeswitchAction('2222', 'speakon');
      Models.util.audio.freeswitchAction('3333', 'speakoff');
      $.ajax.calledWithMatch({ url: "fs.dev/conf/1234/update" }).should.be.true;
      $.ajax.calledWithMatch({ url: "fs.dev/conf/2222/speakon" }).should.be.true;
      $.ajax.calledWithMatch({ url: "fs.dev/conf/3333/speakoff" }).should.be.true;
    });
  });

  describe('setUpRelateClient()', function(){
    before(function(){
      app.room = new Models.Room({roomnum: 1111});
      app.user = new Models.User({username: 'user'});
      sinon.spy(Models.util.audio, "freeswitchAction");
    });

    after(function(){
      app.room = null;
      app.user = null;
      Models.util.audio.freeswitchAction.restore();
    });
    
    it('calls freeswitchAction after connected, but not after other events', function(){
      var audio = new Models.Audio();
      audio.setUpRelateClient();
      audio.trigger('status', 'active');
      Models.util.audio.freeswitchAction.callCount.should.eql(1);
      audio.trigger('status', 'connecting');
      Models.util.audio.freeswitchAction.callCount.should.eql(1);
      audio.trigger('status', 'hangup');
      Models.util.audio.freeswitchAction.callCount.should.eql(1);
    });

    
  });
  
});
