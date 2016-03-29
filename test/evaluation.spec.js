var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _                 = require('underscore');
var chakram           = require('chakram');
var validator         = require('validator');
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

describe("[EVALUATION]", function() {
  var biddingId;
  var contributionId1;
  var p1, p2, p3, p4, p5;
  var cachedRep;
  var arr = [];


  before('reset db, create 5 users, bidding, contribution', () => {
    console.log('BEFORE')
    console.log('Cleansing db ...')
    return util.cleanseDB()
      .then(res => {
        console.log('Creating users and bidding ...')
        arr = [
          util.user.createN(5),
          util.bidding.create()
        ];
        return chakram.all(arr);
      })
      .then(res => {
        var users = res[0];
        biddingId = res[1].body.id;
        p1 = users[0];
        p2 = users[1];
        p3 = users[2];
        p4 = users[3];
        p5 = users[4];
        console.log('Creating contribution ...')
        return util.contribution.create({ userId: p1.id , biddingId: biddingId })
          .then(res => {
            contributionId1 = res.body.id;
            chakram.wait();
          });
      });
  });

  //   1- P1  evaluates  C1  by  1  at time  10000
  it("should create an evaluation", () => {
    var contributionScore; // user and contribution should have same score
    var userContributionDelta = 0.0000000001; // since JS has some glitches with small floating numbers
    return util.evaluation.createOne({
        userId: p1.id,
        contributionId: contributionId1, 
        value: 1
      })
      .then(res => {
        contributionScore = res.body.contributionScore;
        expect(validator.isUUID(res.body.id)).to.be.true;
        expect(contributionScore).to.be.closeTo(0.196437, delta);
        return util.user.get(p1.id)
      })
      .then(res => {
        p1 = res.body;
        expect(p1.reputation).to.be.closeTo(contributionScore, userContributionDelta);
        return chakram.wait();
      })
  });
 

});
