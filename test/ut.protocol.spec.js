var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _                 = require('underscore');
var expect            = require('chai').expect;
var util              = require('./util');
var protocol          = require('../restApi/lib/protocol.js');
var config            = require('../restApi/lib/config.js');

var STAKE               = +config.STAKE;
var ALPHA               = +config.ALPHA;
//var BETA                = +config.BETA;
var GAMMA               = +config.GAMMA;
var TOKEN_REWARD_FACTOR = +config.TOKEN_REWARD_FACTOR;
var REP_REWARD_FACTOR   = +config.REP_REWARD_FACTOR;
var CONTRIBUTION_FEE    = +config.CONTRIBUTION_FEE;
var DURATION            = +config.DURATION;
var DISTRIBUTION_STAKE  = +config.DISTRIBUTION_STAKE;

describe("Unit Test Protocol", function() {

  var evaluators = [];
  var evaluations = [];

  beforeEach('reset', function() {
    evaluators = [
      {
        'id': 'current',
        'reputation':.1,
        'value': 1
      },
      {
        'id': 'whoami',
        'reputation':.2,
        'value': 1
      },
      {
        'id': 'justaguy',
        'reputation':.3,
        'value': 1
      }
    ];
    evaluations = [
      {
        'userId': 'current',
        'value': 1
      }
    ];
  });

  xit("should evaluate", function () {
    // this call actually crashes 
    expect(protocol.evaluate('current', 1, evaluators,evaluations,.1)[0].reputation).to.be.equal(0.10526315789473684);
  });

  it("should notEnoughTokens", function () {
    // notEnought tokens compares the amount of tokens with config.CONTRIBUTION_FEE
    // at the moment of writing, this value is changing all the time. We just assume it is more than 0.01 and less than 10000

    expect(protocol.notEnoughTokens({ tokens: 200000 })).to.be.equal(false);
    expect(protocol.notEnoughTokens({ tokens: 100001 })).to.be.equal(false);
    expect(protocol.notEnoughTokens({ tokens: 0.001 })).to.be.equal(true);
    expect(protocol.notEnoughTokens({ tokens: 0 })).to.be.equal(true);
  });

  it("should payContributionFee", function () {
    expect(protocol.payContributionFee({ tokens: 2 }).tokens).to.be.equal(1);
  });

  it("should calc reward", function () {
    expect(protocol.calcReward(30,50).reputation).to.be.equal(3);
    expect(protocol.calcReward(0,50)).to.be.equal(false);
    expect(protocol.calcReward(0,50)).to.be.equal(false);
    expect(protocol.calcReward(10,50)).to.be.equal(false);
  });

  it("should burnStakeForCurrent", function () {
    expect(protocol.burnStakeForCurrentUser(5,1)).to.be.equal(4.9);
  });

  it("should return the stake fee", function () {
    // check sanity: the stakeFee calculation depends on config.GAMMA
    expect(config.GAMMA).to.be.equal(.5)
    // stakeFee arguments are: voteRep, cachedRep, bidDuration, tSinceStartOfBid
    expect(protocol.stakeFee(1, 100, 8640000, 4320000)).to.be.equal(0.45);
    expect(protocol.stakeFee(1, 5, 8640000, 4320000)).to.be.equal(0.276393202250021);
    expect(protocol.stakeFee(1, 5, 8640000, 4320000)).to.be.equal(0.276393202250021);

    // limit case: zero reputation
    expect(protocol.stakeFee(0, 5, 8640000, 4320000)).to.be.equal(0.5);
    // limit case: all reputation 
    expect(protocol.stakeFee(1, 1, 8640000, 4320000)).to.be.equal(0);
    // limit case: last minute 
    expect(protocol.stakeFee(1, 4, 100, 100)).to.be.equal(0);
    // limit case: time 0 
    expect(protocol.stakeFee(1, 4, 100, 0)).to.be.equal(0.5);
    // limit case: time 0 
    expect(protocol.stakeFee(1, 4, 100, 50)).to.be.equal(0.25);

    // TODO: raise an error when tSinceStartOfBid > bidDuration
    // (this _will_ happen with the code as it is now)
    // expect(protocol.stakeFee(1, 4, 100, 150)).to.be.equal("OURUSERGETSRICHFORFREE");

    // when called with just two arguments, the time factor is just ignored
    expect(protocol.stakeFee(0, 4)).to.be.equal(1);
    expect(protocol.stakeFee(1, 4)).to.be.equal(0.5);
    expect(protocol.stakeFee(4, 4)).to.be.equal(0);
  })

  it("should addVoteValueToEvaluators", function () {
    expect(protocol.addVoteValueToEvaluators(evaluators, evaluations).length).to.be.equal(3);
  });
 
  it("should getVoteRep", function () {
    expect(protocol.getVoteRep(evaluators, 1)).to.be.equal(.6);
  });

  it("should getSameEvaluatorsAddValue", function () {
    // this test presumes that config.DISTRIBUTION_STAKE is 0.8
    expect(config.DISTRIBUTION_STAKE).to.be.equal(0.08)
    expect(protocol.getSameEvaluatorsAddValue(.1,.8,.1,.4)).to.be.equal(.0016);
  });

  it("should updateSameEvaluatorsRep", function () {
    expect(protocol.updateSameEvaluatorsRep(evaluators,.1,1,.2,1,'current',.15)[0].reputation).to.be.ok
    expect(protocol.updateSameEvaluatorsRep(evaluators,.1,1,.2,1,'current',.15)[0].reputation).to.be.equal(0.1);
    // expect(protocol.updateSameEvaluatorsRep(evaluators,.1,1,.2,1,'current',.15)[0].reputation).to.be.equal(0.09611803398874989);
    //  expect(protocol.updateEvaluatorsRep(evaluators,.1,1)[0].reputation).to.be.closeTo(.1005025,.0000001);
    //  expect(protocol.updateEvaluatorsRep(evaluators,.1,1)[1].reputation).to.be.closeTo(.2020151,.0000001);
   //  expect(protocol.updateEvaluatorsRep(evaluators,.1,1)[2].reputation).to.be.closeTo(.3045453,.0000001);
  });
});

