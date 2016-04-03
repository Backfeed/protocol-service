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
  var results = require('../dmag.results.js');
  var contributions = data.contributions;
  var bidCreationTime = undefined; // not relevant for dmag, only slant
  var evaluations = { c1: [], c2: [] };

  //                                           user, contrib, val, debugMode(optional)
  //                                           u, c,    v
  it("should evaluate step 1", () => doStep(1, 1, 'c1', 1) );
  it("should evaluate step 2", () => doStep(2, 2, 'c1', 0) );
  it("should evaluate step 3", () => doStep(3, 3, 'c1', 1) );
  it("should evaluate step 4", () => doStep(4, 4, 'c2', 1) );
  it("should evaluate step 5", () => doStep(5, 5, 'c2', 0) );
  it("should evaluate step 6", () => doStep(6, 1, 'c2', 1) );
  it("should evaluate step 7", () => doStep(7, 2, 'c1', 1) );
  it("should evaluate step 8", () => doStep(8, 3, 'c1', 0) );
  // fix rewarding mechanism after delta hasbeen crossed!
  xit("should evaluate step 9", () => doStep(9, 4, 'c1', 1) );
  xit("should evaluate step 10", () => doStep(10, 5, 'c2', 1) );



  function doStep(step, uid, cid, value, debug) {
    var users = util.clone(results[String(step-1)].users);
    var cachedRep = util.sumReputation(users);
    var contribution = _.findWhere(contributions, {id: cid});
    var user = _.findWhere(users, {id: uid});

    var uid = user.id;
    var newRep = user.reputation;
    evaluations[contribution.id].addOrUpdate({userId: uid, value: value});
    var evaluators = util.clone(mapEvaluationsToUsers(evaluations[contribution.id], users));

    var res = protocol.evaluate(uid, newRep, value, evaluators, evaluations[contribution.id], cachedRep, bidCreationTime, contribution.scoreAtPrevReward, contribution.userId);
    expect(res).to.be.an('object');

    users = updateUsers(evaluators, users);

    if (res.prize)
      contribution.scoreAtPrevReward = res.stats.scorePercentage;

    var expected = results[String(step)];
    _.each(users, u => {
      var r = _.findWhere(expected.users, {id: u.id});

      if (debug)
        util.debugStep(u, r);

      expect(u.reputation).to.be.closeTo(r.reputation, allowedDeviation);
      expect(u.tokens).to.be.closeTo(r.tokens, allowedDeviation);
    });


  }



  // update users to "db" after each step
  function updateUsers(evaluators, users) {
    _.each(evaluators, r => {
      var user = _.findWhere(users, {id: r.id });
      user.reputation = r.reputation;
      user.tokens = r.tokens;
    });
    return users;
  }

  // get evaluators from "db" with their current reputation
  function mapEvaluationsToUsers(evaluations, users) {
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