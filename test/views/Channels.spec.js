describe('Channel (channel-row)', function(){
  describe('render()',function(){
    it('appends html');
    it('it renders controls, unless the user is a moderator');

  });
  describe('renderControls()',function(){
    var hasChannelInterpreter;
    var isInChannel;
    before(function(){
      app.user = new Models.User({lang:'en', _id: '1'});
      hasChannelInterpreter = sinon.stub(Views, 'hasChannelInterpreter');
      hasChannelInterpreter.onCall(0).returns(false);
      hasChannelInterpreter.onCall(1).returns(true);
      isInChannel = sinon.stub(Views, 'isInChannel');
      isInChannel.onCall(0).returns(true);
      isInChannel.onCall(1).returns(true);
      isInChannel.onCall(2).returns(false);
      isInChannel.onCall(3).returns(false);
    });

    after(function(){
      hasChannelInterpreter.restore();
      isInChannel.restore();
    });
    
    it('renders interpret controls if channel does not have an interpreter', function(){
      var channel = new Views.Channel({ el: undefined });
      sinon.stub(channel, 'becomeInterpreter');
      sinon.stub(channel, 'leaveChannel');
      channel.renderControls({channel:{ _id: '666' }});
      channel.becomeInterpreter.calledOnce.should.eql(true);
    });

    it('renders leave controls if user is in the channel', function(){
      var channel = new Views.Channel({el: undefined});
      sinon.stub(channel, 'becomeInterpreter');
      sinon.stub(channel, 'leaveChannel');
      channel.renderControls({channel:{ _id: '666' }});
      channel.leaveChannel.calledOnce.should.eql(true);
    });

    it('renders join controls if user is not in the channel',function(){
      var channel = new Views.Channel({el: undefined});
      sinon.stub(channel, 'becomeInterpreter');
      sinon.stub(channel, 'joinChannel');
      channel.renderControls({channel:{ _id: '666' }});
      channel.joinChannel.calledOnce.should.eql(true);
    });
    
    it('returns self', function(){
      var channel = new Views.Channel({el: undefined});
      sinon.stub(channel, 'becomeInterpreter');
      sinon.stub(channel, 'joinChannel');
      channel.renderControls({channel:{ _id: '666' }}).should.eql(channel);
      
    });
    
  });

});
