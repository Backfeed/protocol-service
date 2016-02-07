var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _ = require('underscore');
var expect = require('chai').expect;
var assert = require('chai').assert;

var protocol = require('../restApi/lib/protocol.js');
var util = require('./util');

var STAKE = 0.05;
var ALPHA = 0.5;
var BETA = 1;
var ROUND_TO = 6;
var TOKEN_REWARD_FACTOR = 15;
var REP_REWARD_FACTOR = 5;

describe("Test protocol according to excel", function() {

  var evaluators = [];
  var evaluations = [];

  before('reset', function() {
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
        'reputation':.3,
        'value': 1
      }
    ];
    evaluations = [
      {
        'userId': 'whoami',
        'value': 1
      }
    ];
  });

  xit("should evaluate", function () {
    expect(protocol.evaluate('current', 1, evaluators,evaluations,.1)[0].reputation).to.be.equal(4.75);
  });

  it("should calc reward", function () {
    expect(protocol.calcReward(30,50).reputation).to.be.equal(3);
    expect(protocol.calcReward(0,50).reputation).to.be.equal(0);
    expect(protocol.calcReward(0,50).tokens).to.be.equal(0);
    expect(protocol.calcReward(10,50).tokens).to.be.equal(3);
  });

  it("should burnStakeForCurrent", function () {
    expect(protocol.burnStakeForCurrentUser(5)).to.be.equal(4.75);
  });

  it("should getSameEvaluatorsAddValue", function () {
    expect(protocol.getSameEvaluatorsAddValue(.1,.8,.1,.4)).to.be.closeTo(.001,.000000001);
  });

  xit("should updateSameEvaluatorsRep", function () {
    expect(protocol.updateSameEvaluatorsRep(evaluators,5,5,5,5,'current')[0].reputation).to.be.equal(4.75);
    expect(protocol.updateSameEvaluatorsRep(evaluators,5,5,5,5,'whoami')[1].reputation).to.be.equal(4.75);
  });

  it("should updateEvaluatorsRep", function () {
    expect(protocol.updateEvaluatorsRep(evaluators,.1,1)[0].reputation).to.be.closeTo(.1005025,.0000001);
    expect(protocol.updateEvaluatorsRep(evaluators,.1,1)[1].reputation).to.be.closeTo(.2020151,.0000001);
    expect(protocol.updateEvaluatorsRep(evaluators,.1,1)[2].reputation).to.be.closeTo(.3045453,.0000001);
  });
});
