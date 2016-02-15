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
  this.timeout(25000);
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

    before(function(){
       browser2 = wd.promiseChainRemote();
       return browser2.init({browserName: 'chrome'});
     });

    after(function(){
      return browser2.quit();
    });
    
    it('should register a new user and go to a new room page', function(){
      return browser
       .elementByCssSelector('#user-name').type('slothrop')
        .elementByCss('#lang-select option[value="en"]').click()
        .elementById('register-submit-button').click()
        .isDisplayed().should.become(false)
        .elementById('welcome-text').text().should.become('Hi, slothrop');
    });

    it('when a new user joins the room, everyone else should get notified', function(){
      var roomNumber;
      
      return browser
        .execute("return app.room.get('roomnum')")
        .then(function(num){
          roomNumber = num;
          num.should.be.above(99);
          num.should.be.below(10000);
        })
        .execute("return app.room.get('users')")
        .then(function(users){
          users.should.have.length(1);
          return browser2.get(URL)
            .elementById('room-number').type(roomNumber)
            .elementById('room-number-button').click()
            .elementById('register-modal')
            .isDisplayed().should.become(true)
            .elementByCssSelector('#user-name').type('Geli')
            .elementByCss('#lang-select option[value="es"]').click()
            .elementById('register-submit-button').click()
            .isDisplayed().should.become(false)
            .elementById('welcome-text').text().should.become('Hola, Geli')
            .execute("return app.room.get('users')")
            .then(function(users){
              users.should.have.length(2);
            });
        })
        .sleep(1000).then(function(){})
        .execute("return app.room.get('users')")
        .then(function(users){
          users.should.have.length(2);
        });
    });
    describe('raise hand', function(){
      var browser_userId;
      it('click should trigger ajax call update hand queue and update backbone model', function(){
        return browser
          .execute("return app.user.get('_id');")
          .then(function(userId){
            browser_userId = userId;
            return browser
              .elementByCss('button.raise-hand')
              .click()
              .sleep(1000).then(function(){})
              .execute("return app.room.get('handsQueue');")
              .then(function(handsQueue){
                handsQueue.should.have.length(1);
              });
          });

      });

      it('queue should display correctly position in the browser ', function(){
        return browser
          .elementById(browser_userId)
          .elementByCss('span.queued')
          .text()
          .should.eventually.become('1');
      });

      it('queue should display correctly in the other browser', function(){
        return browser2
          .elementById(browser_userId)
          .elementByCss('span.queued')
          .text()
          .should.eventually.become('1');
      });

    });
  });
});


