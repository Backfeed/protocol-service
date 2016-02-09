var Immutable = require('immutable');
var _         = require('underscore');
var math      = require('decimal.js');

var STAKE = 0.05;
var ALPHA = 0.5;
var BETA = 1;
var TOKEN_REWARD_FACTOR = 15;
var REP_REWARD_FACTOR = 5;
var CONTRIBUTION_FEE=1;

module.exports = {
  evaluate                  : evaluate,
  calcReward                : calcReward,
  notEnoughTokens           : notEnoughTokens,
  payContributionFee        : payContributionFee,
  addVoteValueToEvaluators  : addVoteValueToEvaluators,
  getVoteRep                : getVoteRep,
  burnStakeForCurrentUser   : burnStakeForCurrentUser,
  getSameEvaluatorsAddValue : getSameEvaluatorsAddValue,
  updateSameEvaluatorsRep   : updateSameEvaluatorsRep,
  updateEvaluatorsRep       : updateEvaluatorsRep
};

function evaluate(uid, value, evaluators, evaluations, cachedRep) {

  var iMap = Immutable.Map({
    newRep: 0,
    voteRep: 0,
    cachedRep: cachedRep
  });

  evaluators = addVoteValueToEvaluators(evaluators, evaluations);
  iMap = iMap.set('newRep', getCurrentUserFrom(evaluators, uid).reputation);
  iMap = iMap.set('voteRep', getVoteRep(evaluators, value));


  evaluators = updateSameEvaluatorsRep(evaluators, iMap.get('newRep'), iMap.get('cachedRep'), iMap.get('voteRep'), value, uid);

  evaluators = updateEvaluatorsRep(evaluators, iMap.get('newRep'), iMap.get('cachedRep'));

  evaluators = cleanupEvaluators(evaluators);

  return evaluators;
}

function addVoteValueToEvaluators(evaluators, evaluations) {
  return _.map(evaluators, function(evaluator) {
    var evalDude = _.find(evaluations, function(evaluation) {
      return evaluation.userId === evaluator.id;
    });
    evaluator.value = evalDude ? evalDude.value : undefined;

    return evaluator;
  });
}

function getVoteRep(evaluators, value) {
  var toAdd = 0;
  return _.reduce(evaluators, function(memo, evaluator) {
    toAdd = evaluator.value === value ? evaluator.reputation : 0;
    return math.add(memo,toAdd).toNumber();
  }, 0);
}

function getCurrentUserFrom(evaluators, currentUserId) {
  return _.find(evaluators, function(evaluator) {
    return evaluator.id === currentUserId;
  });
}

function burnStakeForCurrentUser(currentUserRep) {
  var toMultiply = math.sub(1, STAKE).toNumber();
  return math.mul(currentUserRep, toMultiply).toNumber();
}

function getSameEvaluatorsAddValue(newRep, factor, evaluatorRep, voteRep) {
  return new math(newRep)
                .mul(STAKE)
                .mul(factor)
                .mul(evaluatorRep)
                .div(voteRep)
                .toNumber();
}

function updateSameEvaluatorsRep(evaluators, newRep, cachedRep, voteRep, currentEvaluationValue, currentUserId) {
  var toAdd;
  var factor = math.pow(math.div(voteRep, cachedRep).toNumber(), ALPHA).toNumber();
  return _.map(evaluators, function(evaluator) {

    if ( evaluator.id === currentUserId ) {
      toAdd = getSameEvaluatorsAddValue(newRep, factor, newRep, voteRep);
      evaluator.reputation = math.add(burnStakeForCurrentUser(newRep), toAdd).toNumber();
      //console.log('s e', evaluator);
    }

    else if ( evaluator.value === currentEvaluationValue ) {
      toAdd = getSameEvaluatorsAddValue(newRep, factor, evaluator.reputation, voteRep);
      evaluator.reputation = math.add(evaluator.reputation, toAdd).toNumber();
      //console.log('s v', evaluator);
    }

    return evaluator;
  });
}

function updateEvaluatorsRep(evaluators, currentUserRep, cachedRep) {
  var factor = math.pow(math.div(currentUserRep, cachedRep).toNumber(), BETA).toNumber();
  var toDivide = new math(1)
                        .sub(math.mul(STAKE, factor).toNumber())
                        .toNumber();

  return _.map(evaluators, function(evaluator) {
    evaluator.reputation = math.div(evaluator.reputation, toDivide).toNumber();
    return evaluator;
  });

}

function cleanupEvaluators(evaluators) {
  return _.map(evaluators, function(evaluator) {
    evaluator = _.omit(evaluator, 'value');
    return evaluator;
  });
}

function calcReward(winningContributionScore, cachedRep) {
  return {
    reputation: REP_REWARD_FACTOR * winningContributionScore / cachedRep,
    tokens: TOKEN_REWARD_FACTOR * winningContributionScore / cachedRep
  }
}

function notEnoughTokens(user) {
  return user.tokens < CONTRIBUTION_FEE;
}

function payContributionFee(user) {
  user.tokens -= CONTRIBUTION_FEE;
  return user;
}
