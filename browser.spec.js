// to run the tests, selenium-standalone must be installed and started:
// selenium-standalone start

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

var wd = require('wd');
// enables chai assertion chaining
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

var URL = 'localhost:8080/';

// to run the tests, selenium-standalone must be installed and started:
// selenium-standalone start


describe('home page', function(){
  this.timeout(10000);
  var browser;

  before(function(){
    browser = wd.promiseChainRemote();
    return browser.init({browserName: 'chrome'});
  });

  //beforeEach(function(){
  //    return browser.get(URL);
  //});

  after(function(){
    return browser.quit();
  });

  it('should have correct title', function(){
    return browser
      .get(URL)
      .title().should.become('Mexcla Conferencing');
  });

  it('should display register popup when create room is clicked', function(){
    return browser
      .elementById('create-new-room-button').click()
      .elementById('register-modal')
      .isDisplayed().should.become(true);
  });

  describe('Create new room ', function(){
    var browser2;

    // before(function(){
    //   browser2 = wd.promiseChainRemote();
    //   return browser2.init({browserName: 'chrome'});
    // });

    
    it('should register a new user and go to a new room page', function(){
      return browser
        .elementByCssSelector('#user-name').type('slothrop')
        .elementByCss('#lang-select option[value="en"]').click()
        .elementById('register-submit-button').click()
        .isDisplayed().should.become(false)
        .elementById('welcome-text').text().should.become('Hi, slothrop');
    });

    it('when a new user joins the room, everyone else should get notified', function(done){
      browser
        .eval("window.location.href")
        .then(function(location) {
          console.log(location);
        })
        .nodeify(done);
    });
  });
});


