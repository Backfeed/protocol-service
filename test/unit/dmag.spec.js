var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _                 = require('underscore');
var expect            = require('chai').expect;
var util              = require('../util');
var protocol          = require('../../restApi/lib/protocol.js');
var config            = require('../../restApi/lib/config.js');

var STAKE               = +config.STAKE;
var ALPHA               = +config.ALPHA;
//var BETA                = +config.BETA;
var GAMMA               = +config.GAMMA;
var TOKEN_REWARD_FACTOR = +config.TOKEN_REWARD_FACTOR;
var REP_REWARD_FACTOR   = +config.REP_REWARD_FACTOR;
var CONTRIBUTION_FEE    = +config.CONTRIBUTION_FEE;
var DURATION            = +config.DURATION;
var DISTRIBUTION_STAKE  = +config.DISTRIBUTION_STAKE;


describe("Unit Test DMAG Protocol", () => {

  var allowedDeviation = 0.00005;
  var data = util.clone(require('./dmag.data.js'));
  var results = require('./../dmag.results.js');
  var users = data.users;
  var contributions = data.contributions;
  var bidCreationTime = undefined; // not relevant for dmag, only slant
  var evaluations = { c1: [], c2: [] };
  var cachedRep;

  beforeEach('calc total rep in system', ()=> {
    
    cachedRep = util.sumReputation(users);
  });

  it("should evaluate step 1", () => { step(1, 1, 'c1', 1); });
  it("should evaluate step 2", () => { step(2, 2, 'c1', 0); });
  it("should evaluate step 3", () => { step(3, 3, 'c1', 1); });
  it("should evaluate step 4", () => { step(4, 4, 'c2', 1); });
  it("should evaluate step 5", () => { step(5, 5, 'c2', 0); });
  it("should evaluate step 6", () => { step(6, 1, 'c2', 1); });
  it("should evaluate step 7", () => { step(7, 2, 'c1', 1); });


  function step(n, uid, cid, value) {
    var contribution = _.findWhere(contributions, {id: cid});
    var user = _.findWhere(users, {id: uid});
    var expected = results[String(n)];

    var uid = user.id;
    var newRep = user.reputation;
    evaluations[contribution.id].addOrUpdate({userId: uid, value: value});
    var evaluators = util.clone(mapEvaluationsToUsers(evaluations[contribution.id]));(util.clone(user));

    var res = protocol.evaluate(uid, newRep, value, evaluators, evaluations[contribution.id], cachedRep, bidCreationTime, contribution.scoreAtPrevReward, contribution.userId);
    expect(res).to.be.an('object');
    updateUsers(res.evaluators)

    _.each(users, u => {
      var r = _.findWhere(expected.users, {id: u.id});
      // debugStep(STEPHERE, u, r); // change first argument to step u want to debug
      expect(u.reputation).to.be.closeTo(r.reputation, allowedDeviation);
    });


    function debugStep(step, u, r) {
      if (step === n) {
        util.shout("uid:", u.id, 'rep:', u.reputation, r.reputation, '\n      ', 'tokens:', u.tokens, r.tokens);
      }
    }

  }



  // update users to "db" after each step
  function updateUsers(evaluators) {
    _.each(evaluators, r => {
      var user = _.findWhere(users, {id: r.id });
      user.reputation = r.reputation;
      user.tokens = r.tokens;
    });
    return users;
  }

  // get evaluators from "db" with their current reputation
  function mapEvaluationsToUsers(evaluations) {
    return _.map(evaluations, e => {
      return _.findWhere(users, {id: e.userId});
    });
  }

});

// update evaluation is user evaluated this contribution before
Array.prototype.addOrUpdate = function(evaluation) {
  var prevEval = _.findWhere(this, {userId:evaluation.userId});
  if (prevEval) {
    prevEval.value = evaluation.value;
  } else {
    this.push(evaluation);
  }
}