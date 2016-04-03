var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _                 = require('underscore');
var chakram           = require('chakram');
var util              = require('./util.js');
var config            = require('../restApi/lib/config.js');

expect = chakram.expect;

// This test tests one particular scenario of how reputation evolves
// when evaluation contributions 
// It assumes:
// - an initial distribution of reputation of 0.2 [config.USER_INITIAL_TOKENS]
// - 5 users which made 2 contributions
// - a specific turn of events:
//   1- P1  evaluates  C1  by  1  at time  10000
//   2- P2  evaluates  C1  by  0  at time  20000
//   3- P3  evaluates  C1  by  1  at time  30000
//   4- P4  evaluates  C2  by  1  at time  40000
//   5- P5  evaluates  C2  by  0  at time  50000
//   6- P1  evaluates  C2  by  1  at time  60000

// TODO: generalize the schema to test different scenarios

// since reputation is calculated on the base of passed time
// we cannot be really sure of the resulting values
// delta expresses how much we are allowed to be off the
var delta = 0.05

describe("Test protocol according to excel", function() {
  var biddingId;
  var contributionId1;
  var contributionId2;
  var p1, p2, p3, p4, p5;
  var cachedRep;
  var arr = [];

  before('reset db, create 5 users and a bidding', function() {
    return util.cleanseDB()
      .then(function(res) {
        arr = [
          util.user.createN(5),
          util.bidding.create()
        ];
        return chakram.all(arr);
      })
      .then(function(res) {
        var users = res[0];
        biddingId = res[1].body.id;
        p1 = users[0];
        p2 = users[1];
        p3 = users[2];
        p4 = users[3];
        p5 = users[4];
        return chakram.wait();
      });
  })

  //after('reset db', function() {
  //  return util.cleanseDB().then(function(res) {
  //    return chakram.wait();
  //  });
  //});

  xit("should cost tokens for submitting a contribution", function () {
    arr = [
      util.contribution.create({ userId: p1.id , biddingId: biddingId }),
      util.contribution.create({ userId: p2.id , biddingId: biddingId })
    ];
    return chakram.all(arr)
      .then(function(res) {
        contributionId1 = res[0].body.id;
        contributionId2 = res[1].body.id;
        return util.user.get(p1.id);
      })
      .then(function(res) {
        p1 = res.body;
        // console.log("p1 : ", p1);
        /* the user starts with config.USER_INITIAL_TOKENS
         * and pays config.CONTRIBUTION_FEE
         */
        expect(p1.tokens).to.be.equal( config.USER_INITIAL_TOKENS - config.CONTRIBUTION_FEE);
        return chakram.wait();
      });
  });

  //   1- P1  evaluates  C1  by  1  at time  10000
  xit("should distribute rep according to step 1", function() {
    return util.evaluation.create({
        biddingId: biddingId,
        userId: p1.id,
        evaluations: [{ contributionId: contributionId1, value: 1 }]
      })
      .then(function(res) {
        arr = [
          util.user.get(p1.id),
          util.user.get(p2.id),
          util.user.get(p3.id),
          util.user.get(p4.id),
          util.user.get(p5.id)
        ];
        return chakram.all(arr);
      })
      .then(function(res) {
        p1 = res[0].body;
        p2 = res[1].body;
        p3 = res[2].body;
        p4 = res[3].body;
        p5 = res[4].body;
        expect(p1.reputation).to.be.closeTo(0.196437, delta);
        return chakram.wait();
      })
  });

  //   2- P2  evaluates  C1  by  0  at time  20000
  xit("should distribute rep according to step 2", function() {
    return util.evaluation.create({
      biddingId: biddingId,
      userId: p2.id,
      evaluations: [{ contributionId: contributionId1, value: 0 }]
    })
    .then(function(res) {
      arr = [
        util.user.get(p1.id),
        util.user.get(p2.id),
        util.user.get(p3.id),
        util.user.get(p4.id),
        util.user.get(p5.id)
      ];
      return chakram.all(arr);
    })
    .then(function(res) {
      p1 = res[0].body;
      p2 = res[1].body;
      p3 = res[2].body;
      p4 = res[3].body;
      p5 = res[4].body;
      expect(p1.reputation).to.be.closeTo(0.198428, delta);
      expect(p2.reputation).to.be.closeTo(0.196452, delta);
    })
  });

  //   3- P3  evaluates  C1  by  1  at time  30000
  xit("should distribute rep according to step 3", function() {
    return util.evaluation.create({
      biddingId: biddingId,
      userId: p3.id,
      evaluations: [{ contributionId: contributionId1, value: 1 }]
    })
    .then(function(res) {
      arr = [
        util.user.get(p1.id),
        util.user.get(p2.id),
        util.user.get(p3.id),
        util.user.get(p4.id),
        util.user.get(p5.id)
      ];
      return chakram.all(arr);
    })
    .then(function(res) {
      p1 = res[0].body;
      p2 = res[1].body;
      p3 = res[2].body;
      p4 = res[3].body;
      p5 = res[4].body;
      expect(p1.reputation).to.be.closeTo(0.194881, delta);
      expect(p2.reputation).to.be.closeTo(0.196452, delta);
    })
  });

  //   4- P4  evaluates  C2  by  1  at time  40000
  xit("should distribute rep according to step 4", function() {
    return util.evaluation.create({
      biddingId: biddingId,
      userId: p4.id,
      evaluations: [{ contributionId: contributionId2, value: 1 }]
    })
    .then(function(res) {
      arr = [
        util.user.get(p1.id),
        util.user.get(p2.id),
        util.user.get(p3.id),
        util.user.get(p4.id),
        util.user.get(p5.id)
      ];
      return chakram.all(arr);
    })
    .then(function(res) {
      p1 = res[0].body;
      p2 = res[1].body;
      p3 = res[2].body;
      p4 = res[3].body;
      p5 = res[4].body;
      expect(p1.reputation).to.be.closeTo(0.200013, delta);
      expect(p2.reputation).to.be.closeTo(0.198454, delta);
      expect(p3.reputation).to.be.closeTo(0.195165, delta);
    })
  });

  //   5- P5  evaluates  C2  by  0  at time  50000
  xit("should distribute rep according to step 5", function() {
    return util.evaluation.create({
      biddingId: biddingId,
      userId: p5.id,
      evaluations: [{ contributionId: contributionId2, value: 0 }]
    })
    .then(function(res) {
      arr = [
        util.user.get(p1.id),
        util.user.get(p2.id),
        util.user.get(p3.id),
        util.user.get(p4.id),
        util.user.get(p5.id)
      ];
      return chakram.all(arr);
    })
    .then(function(res) {
      p1 = res[0].body;
      p2 = res[1].body;
      p3 = res[2].body;
      p4 = res[3].body;
      p5 = res[4].body;
      expect(p1.reputation).to.be.closeTo(0.204674, delta);
      expect(p2.reputation).to.be.closeTo(0.200472, delta);
      expect(p3.reputation).to.be.closeTo(0.199713, delta);
      expect(p4.reputation).to.be.closeTo(0.194559, delta);
    })
  });

  //   6- P1  evaluates  C2  by  1  at time  60000
  xit("should distribute rep according to step 6", function() {
    return util.evaluation.create({
      biddingId: biddingId,
      userId: p1.id,
      evaluations: [{ contributionId: contributionId2, value: 1 }]
    })
    .then(function(res) {
      arr = [
        util.user.get(p1.id),
        util.user.get(p2.id),
        util.user.get(p3.id),
        util.user.get(p4.id),
        util.user.get(p5.id)
      ];
      return chakram.all(arr);
    })
    .then(function(res) {
      p1 = res[0].body;
      p2 = res[1].body;
      p3 = res[2].body;
      p4 = res[3].body;
      p5 = res[4].body;
      expect(p1.reputation).to.be.closeTo(0.206743, delta);
      expect(p2.reputation).to.be.closeTo(0.205699, delta);
      expect(p3.reputation).to.be.closeTo(0.201731, delta);
      expect(p4.reputation).to.be.closeTo(0.196525, delta);
      expect(p5.reputation).to.be.closeTo(0.195114, delta);
    })
  });


});
