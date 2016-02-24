'use strict';

module.exports = {
  createBidding                     : createBidding,
  getBiddingWithLeadingContribution : getBiddingWithLeadingContribution,
  getBiddingContributions           : getBiddingContributions,
  getBiddingUserEvaluations         : getBiddingUserEvaluations,
  endBidding                        : endBidding,
  getBidding                        : getBidding,
  getContributions                  : getContributions,
  deleteBidding                     : deleteBidding
};

var _               = require('underscore');
var async           = require('async');
var util            = require('./helper');
var db              = require('./db');
var config          = require('./config');
var protocol        = require('./protocol');
var getCachedRep    = require('./getCachedRep');
var contributionLib = require('./contributions');
var evaluationsLib  = require('./evaluations');
var usersLib        = require('./users');

function createBidding(event, cb) {

  var newBidding = {
    "id": util.uuid(),
    "status": 'InProgress',
    "duration": event.duration || parseFloat(process.env.DURATION),
    "createdAt": Date.now()
  };

  var params = {
    TableName : config.tables.biddings,
    Item: newBidding
  };

  return db.put(params, cb, newBidding);
}

function getBidding(event, cb) {

  var params = {
    TableName : config.tables.biddings,
    Key: { id: event.id }
  };

  return db.get(params, cb);
}

function getBiddingWithLeadingContribution(event, cb) {
  async.parallel({
      bidding: function(parallelCB) {
        getBidding(event, parallelCB);
      },
      winningContribution: function(parallelCB) {
        getWinningContribution(event.id, parallelCB);
      }
    },
    function(err, results) {
      var bidding = results.bidding;
      if (_.isEmpty(bidding)) {
        return cb(err);
      }
      bidding.winningContributionId = results.winningContribution.id;
      bidding.winningContributionScore = results.winningContribution.score;
      cb(err, bidding);
    }
  );
}

function getWinningContribution(biddingId, cb) {
  var evaluations;
  async.waterfall([
      function(waterfallCB) {
        evaluationsLib.getByValue(biddingId, 1, waterfallCB);
      },
      function(result, waterfallCB) {
        util.log.info("evaluations : ", result);
        evaluations = result;
        usersLib.getUsersByEvaluations(evaluations, waterfallCB);
      },
      function(users) {
        util.log.info("users : ", users);
        var winningContribution = protocol.calcWinningContribution(users, evaluations);
        cb(null, winningContribution);
      }
    ],
    function(err) {
      cb(err);
    }
  );
}

function getBiddingContributions(event, cb) {

  var contributions;
  var evaluations;
  async.waterfall([
    function(waterfallCB) {
      getContributions(event, waterfallCB);
    },
    function(result, waterfallCB) {
      contributions = result;
      getUserEvaluations(event, waterfallCB);
    },
    function(result, waterfallCB) {
      evaluations = result.items;
      if (contributions && event.userId)
      {
        _.each(contributions, function(element) {
          var myEval = _.find(evaluations, function(item) { return item.contributionId === element.id});
          if (myEval) {
            element.userContext = {};
            element.userContext.evaluation = {};
            element.userContext.evaluation.id = myEval.id;
            element.userContext.evaluation.value = myEval.value;
          }
        });
      }
      waterfallCB(null, contributions);
    }
  ], function (err, result) {
    return cb(null, result);
  });
}

function getContributions(event, cb) {

  var params = {
    TableName : config.tables.contributions,
    IndexName: 'contributions-biddingId-createdAt',
    KeyConditionExpression: 'biddingId = :hkey',
    ExpressionAttributeValues: { ':hkey': event.id }
  };

  return db.query(params, cb);
}

function getBiddingUserEvaluations(event, cb) {
  async.waterfall([
    function(waterfallCB) {
      getUserEvaluations(event, waterfallCB);
    }
  ], function (err, result) {
    if (_.isEmpty(result)) {
      err = '404:Resource not found.';
      return cb(err);
    }
    return cb(null, result.items);
  });
}

function getUserEvaluations(event, cb) {
  var params = {
    TableName : config.tables.evaluations,
    IndexName: 'evaluations-biddingId-userId',
    KeyConditionExpression: 'biddingId = :hkey and userId = :rkey',
    ExpressionAttributeValues: {
      ':hkey': event.id,
      ':rkey': event.userId
    }
  };
  return db.query(params, cb);
}

function endBidding(event, cb) {
  var biddingId = event.id;
  var cachedRep;
  var winningContributionId;
  var winningContributionScore;

  async.waterfall([

    function(waterfallCB) {
      async.parallel({
          cachedRep: function(parallelCB) {
            getCachedRep(parallelCB);
          },
          winningContribution: function(parallelCB) {
            getWinningContribution(biddingId, parallelCB);
          },
          bidding: function(parallelCB) {
            getBidding({ id: event.id }, parallelCB);
          }
        },
        function(err, results) {
          util.log.info("Results : ", results);
          if(results.bidding.status === 'Completed') return cb('400: bad request. bidding is completed!');
          cachedRep = results.cachedRep.theValue;
          winningContributionId = results.winningContribution.id;
          winningContributionScore = results.winningContribution.score;
          waterfallCB(err, null);
        });
    },

    function(emptyResult, waterfallCB) {
      util.log.info("emptyResult : ", emptyResult);
      contributionLib.getContribution({ id: winningContributionId }, waterfallCB);
    },

    function(winningContribution) {
      async.parallel({
        endBiddingInDb: function(parallelCB) {
          endBiddingInDb(biddingId, winningContributionId, parallelCB);
        },
        rewardContributor: function(parallelCB) {
          var prize = protocol.calcReward(winningContributionScore, cachedRep);
          util.log.info("prize : ", prize);
          if (prize) {
            usersLib.rewardContributor(winningContribution.userId, prize.reputation, prize.tokens, parallelCB);
          } else {
            parallelCB(null, null);
          }
        }
      },
        function(err, results) {
          util.log.info("Results : ", results);
          var bidding = results.endBiddingInDb;
          bidding.winningContributorId = winningContribution.userId;
          return cb(err, bidding);
        });
    }
  ]);
}

function deleteBidding(event, cb) {

  var params = {
    TableName : config.tables.biddings,
    Key: { id: event.id },
    ReturnValues: 'ALL_OLD'
  };

  return db.del(params, cb);
}

function endBiddingInDb(id, winningContributionId, cb) {
  var params = {
    TableName: config.tables.biddings,
    Key: { id: id },
    UpdateExpression: 'set #sta = :s, #win = :w, #end = :e',
    ExpressionAttributeNames: {
      '#sta' : 'status',
      '#win' : 'winningContributionId',
      '#end' : 'endedAt'
    },
    ExpressionAttributeValues: {
      ':s' : 'Completed',
      ':w' : winningContributionId,
      ':e' : Date.now()
    },
    ReturnValues: 'ALL_NEW'
  };

  return db.update(params, cb);
}
