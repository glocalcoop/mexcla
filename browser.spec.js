// to run the tests, selenium-standalone must be installed and started:
// selenium-standalone start

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

const wd = require('wd');
// enables chai assertion chaining
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

const URL = 'localhost:8080/';

// to run the tests, selenium-standalone must be installed and started:
// selenium-standalone start


describe('home page', function(){
  var browser;

  before(function(){
    browser = wd.promiseChainRemote();
    return browser.init({browserName: 'chrome'});
  });

  after(function(){
    return browser.quit();
  });

  it('should have correct title', function(){
    browser
      .get(URL)
      .title().should.become('Mexcla Conferencing');
  });
});










