// Test the mongoose Room model
'use strict';

// import the moongoose helper utilities
var utils = require('./utils');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var should = require('chai').should();
mongoose.connect('mongodb://localhost/testdb');
// import our User mongoose model
// var Room = require('../models/Room')(mongoose);
var Room = require('../models/Room').Room;
// console.log(Room);

describe('Room: model', function() {
  describe('#create()', function () {
    it('expects create a new Room', function (done) {
      // Create a User object to pass to User.create()
     var r = {
       roomnum: '101',
       users: ['joe', 'mary', 'bob']
     }
     Room.create(r, function (err, createdRoom) {
       console.log(createdRoom);
       // console.log(err);
       // Confirm that that an error does not exist
       should.not.exist(err);
       // verify that the returned user is what we expect

       createdRoom.roomnum.should.equal('101');
       createdRoom.users.should.be.a('array');
       createdRoom.users.should.have.length(3);

       // Call done to tell mocha that we are done with this test
       done();
     });
   });
   describe('#findOneAndUpdate()', function() {
     it('expects users added to a room', function(done) {
       // Need to include create again since
       // other operations fail without it????
       var r = {
        roomnum: '101',
        users: ['joe', 'mary', 'bob']
       }
       Room.create(r, function (err, createdRoom) {
        console.log(createdRoom);
        // console.log(err);
        // Confirm that that an error does not exist
        should.not.exist(err);
        // verify that the returned user is what we expect

        createdRoom.roomnum.should.equal('101');
        createdRoom.users.should.be.a('array');
        createdRoom.users.should.have.length(3);

        // Call done to tell mocha that we are done with this test
       });
       Room.findOneAndUpdate(
         {roomnum: '101'},
         {$push: {users: 'boris'}},
         {safe: true, upsert: true}
       );
       // console.log(test);
       Room.findOne({ roomnum: '101' }, function(err, updatedRoom) {
         should.not.exist(err);
         updatedRoom.users.should.be.a('array');
         updatedRoom.users.should.have.length(1);
       });
       done();
      });
    });
  });
});

