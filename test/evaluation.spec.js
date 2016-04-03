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
  var evaluation1;
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
  xit("should create an evaluation", () => {
    var value = 1;

    return util.evaluation.createOne({
        userId: p1.id,
        contributionId: contributionId1, 
        value: value
      })
      .then(res => {
        evaluation1 = res.body;
        expect(evaluation1.contributionScore).to.be.a('number')
        expect(evaluation1.contributionScorePercentage).to.be.a('number')
        expect(validator.isUUID(evaluation1.id)).to.be.true;
        expect(evaluation1.userId).to.equal(p1.id);
        expect(evaluation1.contributionId).to.equal(contributionId1);
        expect(evaluation1.value).to.equal(value);
        expect(evaluation1.createdAt).to.be.a('number');
        expect(evaluation1.evaluatorNewTokenBalance).to.be.a('number');
        expect(evaluation1.evaluatorNewReputationBalance).to.be.a('number');
      });
  });

});
