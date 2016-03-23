var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _                 = require('underscore');
var expect            = require('chai').expect;
var util              = require('./util');
var protocol          = require('../restApi/lib/protocol.js');
var config            = require('../restApi/lib/config.js');

var STAKE               = parseFloat(config.STAKE);
var ALPHA               = parseFloat(config.ALPHA);
//var BETA                = parseFloat(config.BETA);
var GAMMA               = parseFloat(config.GAMMA);
var TOKEN_REWARD_FACTOR = parseFloat(config.TOKEN_REWARD_FACTOR);
var REP_REWARD_FACTOR   = parseFloat(config.REP_REWARD_FACTOR);
var CONTRIBUTION_FEE    = parseFloat(config.CONTRIBUTION_FEE);
var DURATION            = parseFloat(config.DURATION);
var DISTRIBUTION_STAKE  = parseFloat(config.DISTRIBUTION_STAKE);

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
    expect(protocol.evaluate('current', 1, evaluators,evaluations,.1)[0].reputation).to.be.equal(0.10526315789473684);
  });

  it("should notEnoughTokens", function () {
    expect(protocol.notEnoughTokens({ tokens: 2 })).to.be.equal(false);
    expect(protocol.notEnoughTokens({ tokens: 1 })).to.be.equal(false);
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
    expect(protocol.stakeFee(1, 5, 100, 8640000, 4320000)).to.be.equal(0.42752203363223046);
  });

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

  xit("should updateSameEvaluatorsRep", function () {
    expect(protocol.updateSameEvaluatorsRep(evaluators,.1,1,.2,1,'current',.15)[0].reputation).to.be.equal(0.09611803398874989);
    //expect(protocol.updateSameEvaluatorsRep(evaluators,.1,1,.2,1,'whoami')[1].reputation).to.be.equal();
  });

  //it("should updateEvaluatorsRep", function () {
  //  expect(protocol.updateEvaluatorsRep(evaluators,.1,1)[0].reputation).to.be.closeTo(.1005025,.0000001);
  //  expect(protocol.updateEvaluatorsRep(evaluators,.1,1)[1].reputation).to.be.closeTo(.2020151,.0000001);
  //  expect(protocol.updateEvaluatorsRep(evaluators,.1,1)[2].reputation).to.be.closeTo(.3045453,.0000001);
  //});
});
