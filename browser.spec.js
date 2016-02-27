// to run the tests, selenium-standalone must be installed and started:
// selenium-standalone start

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
var wd = require('wd');
// enables chai assertion chaining
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

var mongojs = require('mongojs');
var db = mongojs('localhost:27018/mexcladb_test', ['rooms']);

var URL = 'localhost:8080/';

describe('home page', function(){
  this.timeout(100000);
  var browser;

  before(function(){
    browser = wd.promiseChainRemote();
    return browser.init({browserName: 'chrome'});
  });

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
      var browser_userId; // slothrop
      var browser2_userId; // geli
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

      describe('another user (browser 2, that is) raises their hand', function(){

        it('queue update in browser2', function(){
          return browser2
            .execute("return app.user.get('_id');")
            .then(function(userId){
              browser2_userId = userId;

              return browser2
                .elementByCss('button.raise-hand')
                .click()
                .sleep(1000).then(function(){})
                .execute("return app.room.get('handsQueue');")
                .then(function(handsQueue){
                  handsQueue.should.have.length(2);
                 });
             });
        });

        it('queue is displayed  in browser', function(done){
          
          browser
            .elementById(browser2_userId, function(err, elem){
              elem.elementByCss('span.queued').then(function(elem){
                elem.text().then(function(text){
                  text.should.eql('2');
                }).nodeify(done);
              });
            });
        });
        
        describe('call on geli in browser 2', function(){

          before(function(done){
            browser
              .elementById(browser2_userId, function(err, elem){
                elem.elementByCss('button.call-on').then(function(elem){
                  elem.click().then(function(){
                    browser.sleep(750).then(function(){
                    }).nodeify(done);
                  });
                });
              });
          });

          it('should update queue in browser', function(done){
            
            browser
              .elementById(browser2_userId, function(err, elem){
                elem.elementByCss('span.queued').then(function(elem){
                  elem.text().then(function(text){
                    text.should.eql('');
                  }).nodeify(done);
                });
              });
          });

          it('should put user in the called on position', function(){
            return browser
              .execute("return app.room.get('calledon');")
              .then(function(person){
                person.username.should.equal('Geli');
              });
          });
        });
      });
    });
  });
});


describe('Direct linking to pages', function(){
  this.timeout(10000);
  var browser;
  var userid;

  before(function(){
    browser = wd.promiseChainRemote();
    return browser.init({browserName: 'chrome'});
  });

  after(function(){
    return browser.quit();
  });

  after(function(done){
   db.rooms.remove({ roomnum: { $in: [9999,1234] }}, function(err, room){
      if (err) {
        console.err(err);
      }
      done();
    });
  });

  it('should create a new room implicitly', function(){
    return browser.get(URL)
      .elementById('room-number').type('9999')
      .elementById('room-number-button').click()
      .elementByCssSelector('#user-name').type('Geli')
      .elementByCss('#lang-select option[value="es"]').click()
      .elementById('register-submit-button').click()
      .isDisplayed().should.become(false)
      .elementById('welcome-text').text().should.become('Hola, Geli')
      .hasElementById('participant-list').should.become(true)
      .execute("return app.room.get('roomnum')")
      .then(function(roomnum){
        roomnum.should.eql(9999);
      })
      .execute("return app.user.get('_id')")
      .then(function(id){
        userid = id;
      });
  });

  it('Going back to homepage keeps user logged in', function(){
    return browser.get(URL)
      .elementById('welcome-text').text()
      .should.become('Hola, Geli')
      .hasElementById('participant-list').should.become(false)
      .execute('return app.router.isLoggedIn()')
      .then(function(answer){
        answer.should.eql(true);
      });
      
  });

  it('Logged-in user should be able to return to room by going directly to /#room/:roomnum', function(){
    return browser.get(URL + '#room/9999')
      .hasElementById('participant-list').should.become(true)
      .hasElementById('room-info').should.become(true);
  });

  it('Logged-in user should be able to implicitly create room by going directly to /#room/:roomnum', function(){
    return browser.get(URL + '#room/1234')
      .hasElementById('participant-list').should.become(true)
      .hasElementById('room-info').should.become(true)
      .execute("return app.room.get('roomnum')")
      .then(function(roomnum){
        roomnum.should.eql(1234);
      });
  });

  describe('also works with non-logged-in user', function(){
    var browser2;

    before(function(){
      browser2 = wd.promiseChainRemote();
      return browser2.init({browserName: 'chrome'});
    });

    after(function(){
      return browser2.quit();
    });

    it('should prompt register modal when going to directly linked room page', function(){
      return browser2.get(URL + '#room/1234')
        //.elementById('register-modal')
        //.isDisplayed().should.become(true)
        //.sleep(20000).then(function(){})
    });
    

  });
});
