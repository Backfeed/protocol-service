var Immutable = require('immutable');
var _         = require('underscore');
var math      = require('decimal.js');
var util      = require('./helper');

var STAKE               = parseFloat(process.env.STAKE);
var ALPHA               = parseFloat(process.env.ALPHA);
//var BETA                = parseFloat(process.env.BETA);
var GAMMA               = parseFloat(process.env.GAMMA);
var TOKEN_REWARD_FACTOR = parseFloat(process.env.TOKEN_REWARD_FACTOR);
var REP_REWARD_FACTOR   = parseFloat(process.env.REP_REWARD_FACTOR);
var CONTRIBUTION_FEE    = parseFloat(process.env.CONTRIBUTION_FEE);
var DURATION            = parseFloat(process.env.DURATION);
var DISTRIBUTION_STAKE  = parseFloat(process.env.DISTRIBUTION_STAKE);
var REWARD_THRESHOLD    = parseFloat(process.env.REWARD_THRESHOLD);

module.exports = {
  evaluate                  : evaluate,
  calcReward                : calcReward,
  notEnoughTokens           : notEnoughTokens,
  payContributionFee        : payContributionFee,
  addVoteValueToEvaluators  : addVoteValueToEvaluators,
  getVoteRep                : getVoteRep,
  burnStakeForCurrentUser   : burnStakeForCurrentUser,
  stakeFee                  : stakeFee,
  getSameEvaluatorsAddValue : getSameEvaluatorsAddValue,
  updateSameEvaluatorsRep   : updateSameEvaluatorsRep,
  calcWinningContribution   : calcWinningContribution,
  getEvaluationsByVotedValue: getEvaluationsByVotedValue,
  sumReputation             : sumReputation,
  calcScore                 : calcScore,
  calcUpScore               : calcUpScore
  //updateEvaluatorsRep       : updateEvaluatorsRep
};

function evaluate(uid, value, evaluators, evaluations, cachedRep, bidCreationTime) {

  // In the current slant protocol, only up-votes are counted for
  if (parseInt(value) !== 0) {

    var iMap = Immutable.Map({
      newRep: 0,
      voteRep: 0,
      totalVoteRep: 0,
      cachedRep: cachedRep
    });

    evaluators = addVoteValueToEvaluators(evaluators, evaluations);
    iMap = iMap.set('newRep', getCurrentUserFrom(evaluators, uid).reputation);
    iMap = iMap.set('voteRep', getVoteRep(evaluators, value));
    //iMap = iMap.set('totalVoteRep', getTotalVotedRep(evaluators));


    evaluators = updateSameEvaluatorsRep(evaluators, iMap.get('newRep'), iMap.get('cachedRep'), iMap.get('voteRep'), value, uid, bidCreationTime);

    //evaluators = updateEvaluatorsRep(evaluators, iMap.get('newRep'), iMap.get('cachedRep'));

    evaluators = cleanupEvaluators(evaluators);
  }
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

function getTotalVotedRep(evaluators) {
  var toAdd = 0;
  return _.reduce(evaluators, function(memo, evaluator) {
    toAdd = evaluator.reputation;
    return math.add(memo,toAdd).toNumber();
  }, 0);
}

function getCurrentUserFrom(evaluators, currentUserId) {
  return _.find(evaluators, function(evaluator) {
    return evaluator.id === currentUserId;
  });
}

function burnStakeForCurrentUser(currentUserRep, fee) {
  var toMultiply = math.sub(1, math.mul(STAKE, fee)).toNumber();
  return math.mul(currentUserRep, toMultiply).toNumber();
}

function stakeFee(voteRep, cachedRep, bidDuration, tSinceStartOfBid) {
  var repFactor = math.sub(1, math.pow(math.div(voteRep, cachedRep), GAMMA));
  var timeFactor = math.sub(1, math.div(tSinceStartOfBid, bidDuration));
  return math.mul(repFactor, timeFactor).toNumber();
}

function getSameEvaluatorsAddValue(newRep, factor, evaluatorRep, voteRep) {
  return new math(newRep)
                .mul(DISTRIBUTION_STAKE)
                .mul(factor)
                .mul(evaluatorRep)
                .div(voteRep)
                .toNumber();
}

function updateSameEvaluatorsRep(evaluators, newRep, cachedRep, voteRep, currentEvaluationValue, currentUserId, bidCreationTime) {
  var toAdd;
  var factor = math.pow(math.div(voteRep, cachedRep).toNumber(), ALPHA).toNumber();
  return _.map(evaluators, function(evaluator) {

    if ( evaluator.id === currentUserId ) {
      var tSinceStarted = math.sub(Date.now(), bidCreationTime).toNumber();
      util.log.info("tSinceStarted : ", tSinceStarted, " , bidCreationTime : ", bidCreationTime);
      var fee = stakeFee(voteRep, cachedRep, DURATION, tSinceStarted);
      // why? once a user pays himself he can profit only by evaluating - risk free
      //toAdd = getSameEvaluatorsAddValue(newRep, factor, newRep, voteRep);
      //evaluator.reputation = math.add(burnStakeForCurrentUser(newRep, fee), toAdd).toNumber();
      evaluator.reputation = burnStakeForCurrentUser(newRep, fee);
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

// In Version 0.0.2 this function was removed
//function updateEvaluatorsRep(evaluators, currentUserRep, cachedRep) {
//  var factor = math.pow(math.div(currentUserRep, cachedRep).toNumber(), BETA).toNumber();
//  var toDivide = new math(1)
//                        .sub(math.mul(STAKE, factor).toNumber())
//                        .toNumber();
//
//  return _.map(evaluators, function(evaluator) {
//    evaluator.reputation = math.div(evaluator.reputation, toDivide).toNumber();
//    return evaluator;
//  });
//
//}

function cleanupEvaluators(evaluators) {
  return _.map(evaluators, function(evaluator) {
    evaluator = _.omit(evaluator, 'value');
    return evaluator;
  });
}

function calcReward(winningContributionScore, cachedRep) {
  //TODO: make this the total and not only the addition
  var score = math.div(winningContributionScore, cachedRep).toNumber();
  util.log.info("score : ", score, " , RT : ", REWARD_THRESHOLD);
  if (score < REWARD_THRESHOLD) return false;
  return {
    reputation: math.mul(REP_REWARD_FACTOR, score).toNumber(),
    tokens: math.mul(TOKEN_REWARD_FACTOR, score).toNumber()
  }
}

function notEnoughTokens(user) {
  return user.tokens < CONTRIBUTION_FEE;
}

function payContributionFee(user) {
  user.tokens = math.sub(user.tokens, CONTRIBUTION_FEE).toNumber();
  return user;
}

function calcWinningContribution(users, evaluations) {
  var scores = {};
  _.each(evaluations, function(evaluation) {
    if (!scores[evaluation.contributionId])
      scores[evaluation.contributionId] = 0;

    scores[evaluation.contributionId] += _.findWhere(users, { id: evaluation.userId }).reputation;
  });
  var winningContribution = _.max(_.pairs(scores), _.last);
  return {
    id: winningContribution[0],
    score: winningContribution[1]
  };
}

function getEvaluationsByVotedValue(evaluations, votedValue) {
  return _.map(evaluations, {value: votedValue});
}

function sumReputation(users) {
  util.log.info("sumReputation users : ", users);
  return _.reduce(users, function(memo, user) {
    return math.add(memo ,user.reputation).toNumber();
  }, 0)
}

function calcScore(repUp, totalRep) {
  return math.div(repUp, totalRep).toNumber();
}

function calcUpScore(users, totalRep) {
  var repUp = sumReputation(users);
  return calcScore(repUp, totalRep);
}
