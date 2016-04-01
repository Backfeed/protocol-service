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
  var data = util.clone(require('./dmag.data.json'));
  var users = data.users;
  var contributions = data.contributions;
  var bidCreationTime = undefined; // not relevant for dmag, only slant
  var evaluations = { c1: [], c2: [] };
  var cachedRep;
  var res; // keep this global for afterEach hook

  beforeEach('calc total rep in system', ()=> {
    cachedRep = util.sumReputation(users);
    // util.shout('cachedRep', cachedRep);
  });

  afterEach('update users rep from lest response', ()=> {
    users = updateUsers(res);
    // util.shout(users);
  });


  it("should evaluate step 1", () => {
    var contribution = _.findWhere(contributions, {id: 'c1'});
    var user = users[0];
    var uid = user.id;
    var newRep = user.reputation;
    var value = 1;
    evaluations[contribution.id].addOrUpdate({userId: uid, value: value});
    var evaluators = mapEvaluationsToUsers(evaluations[contribution.id]);
    res = protocol.evaluate(uid, newRep, value, evaluators, evaluations[contribution.id], cachedRep, bidCreationTime);
    expect(res).to.be.an('object');
    expect(resToRep(res, 0)).to.be.closeTo(19.7788854382, allowedDeviation);
  });

  it("should evaluate step 2", () => {
    var contribution = _.findWhere(contributions, {id: 'c1'});
    var user = users[1];
    var uid = user.id;
    var newRep = user.reputation;
    var value = 0;
    evaluations[contribution.id].addOrUpdate({userId: uid, value: value});
    var evaluators = mapEvaluationsToUsers(evaluations[contribution.id]);(util.clone(user));

    res = protocol.evaluate(uid, newRep, value, evaluators, evaluations[contribution.id], cachedRep, bidCreationTime);
    expect(res).to.be.an('object');
    expect(resToRep(res, 0)).to.be.closeTo(19.7788854382, allowedDeviation);
    expect(resToRep(res, 1)).to.be.closeTo(19.8525613977, allowedDeviation);
  });

  it("should evaluate step 3", () => {
    var contribution = _.findWhere(contributions, {id: 'c1'});
    var user = users[2];
    var uid = user.id;
    var newRep = user.reputation;
    var value = 1;
    evaluations[contribution.id].addOrUpdate({userId: uid, value: value});
    var evaluators = mapEvaluationsToUsers(evaluations[contribution.id]);(util.clone(user));

    res = protocol.evaluate(uid, newRep, value, evaluators, evaluations[contribution.id], cachedRep, bidCreationTime);
    expect(res).to.be.an('object');
    expect(resToRep(res, 0)).to.be.closeTo(20.1972438528, allowedDeviation);
    expect(resToRep(res, 1)).to.be.closeTo(19.8525613977, allowedDeviation);
    expect(resToRep(res, 2)).to.be.closeTo(19.9094563837, allowedDeviation);
  });

  it("should evaluate step 4", () => {
    var contribution = _.findWhere(contributions, {id: 'c2'});
    var user = users[3];
    var uid = user.id;
    var newRep = user.reputation;
    var value = 1;
    evaluations[contribution.id].addOrUpdate({userId: uid, value: value});
    var evaluators = mapEvaluationsToUsers(evaluations[contribution.id]);(util.clone(user));

    res = protocol.evaluate(uid, newRep, value, evaluators, evaluations[contribution.id], cachedRep, bidCreationTime);
    expect(res).to.be.an('object');
    expect(resToRep(res, 3)).to.be.closeTo(19.7789218868, allowedDeviation);
  });

  it("should evaluate step 5", () => {
    var contribution = _.findWhere(contributions, {id: 'c2'});
    var user = users[4];
    var uid = user.id;
    var newRep = user.reputation;
    var value = 0;
    evaluations[contribution.id].addOrUpdate({userId: uid, value: value});
    var evaluators = mapEvaluationsToUsers(evaluations[contribution.id]);(util.clone(user));

    res = protocol.evaluate(uid, newRep, value, evaluators, evaluations[contribution.id], cachedRep, bidCreationTime);
    expect(res).to.be.an('object');
    expect(resToRep(res, 3)).to.be.closeTo(19.7789218868, allowedDeviation);
    expect(resToRep(res, 4)).to.be.closeTo(19.8526130418, allowedDeviation);
  });

  it("should evaluate step 6", () => {
    var contribution = _.findWhere(contributions, {id: 'c2'});
    var user = users[0];
    var uid = user.id;
    var newRep = user.reputation;
    var value = 1;
    evaluations[contribution.id].addOrUpdate({userId: uid, value: value});
    var evaluators = mapEvaluationsToUsers(evaluations[contribution.id]);(util.clone(user));

    res = protocol.evaluate(uid, newRep, value, evaluators, evaluations[contribution.id], cachedRep, bidCreationTime);
    expect(res).to.be.an('object');
    expect(resToRep(res, 0)).to.be.closeTo(20.1063878036, allowedDeviation);
    expect(resToRep(res, 3)).to.be.closeTo(20.2009009717, allowedDeviation);
    expect(resToRep(res, 4)).to.be.closeTo(19.8526130418, allowedDeviation);
  });

  it("should evaluate step 7", () => {
    var contribution = _.findWhere(contributions, {id: 'c1'});
    var user = users[1];
    var uid = user.id;
    var newRep = user.reputation;
    var value = 1;
    evaluations[contribution.id].addOrUpdate({userId: uid, value: value});
    var evaluators = mapEvaluationsToUsers(evaluations[contribution.id]);(util.clone(user));

    res = protocol.evaluate(uid, newRep, value, evaluators, evaluations[contribution.id], cachedRep, bidCreationTime, contribution.scoreAtPrevReward, contribution.userId);
    expect(res).to.be.an('object');
    expect(resToRep(res, 0)).to.be.closeTo(20.4790529214, allowedDeviation);
    expect(resToRep(res, 1)).to.be.closeTo(22.7586066615, allowedDeviation);
    expect(resToRep(res, 2)).to.be.closeTo(20.2784714441, allowedDeviation);
  });










  // update users to "db" after each step
  function updateUsers(res) {
    _.each(res.evaluators, r => {
      var user = _.findWhere(users, {id: r.id });
      user.reputation = r.reputation;
    });
    return users;
  }

  // get evaluators from "db" with their current reputation
  function mapEvaluationsToUsers(evaluations) {
    return _.map(evaluations, e => {
      return _.findWhere(users, {id: e.userId});
    });
  }

  // get user n-1 from response
  function resToRep(res, n) {
    return _.findWhere(res.evaluators, {id: users[n].id}).reputation;
  }
});

Array.prototype.addOrUpdate = function(evaluation) {
  var prevEval = _.findWhere(this, {userId:evaluation.userId});
  if (prevEval) {
    prevEval.value = evaluation.value;
  } else {
    this.push(evaluation);
  }
}