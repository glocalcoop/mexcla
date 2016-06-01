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
});
