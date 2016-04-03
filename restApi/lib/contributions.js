'use strict';

module.exports = {
  createContribution          : createContribution,
  getContribution             : getContribution,
  getContributions            : getContributions,
  getContributionWithStats    : getContributionWithStats,
  getContributions            : getContributions,
  getContributionEvaluations  : getContributionEvaluations,
  getContributionUsers        : getContributionUsers,
  deleteContribution          : deleteContribution,
  getContributionScore        : getContributionScore,
  addToMaxScore               : addToMaxScore
};

var async          = require('async');
var _              = require('underscore');
var util           = require('./helper');
var db             = require('./db');
var config         = require('./config');
var biddingLib     = require('./biddings');
var usersLib       = require('./users');
var protocol       = require('./protocol');
var evaluationsLib = require('./evaluations');
var getCachedRep   = require('./getCachedRep');

function createContribution(event, cb) {

  var user;

  var newContribution = {
    "id": util.uuid(),
    "userId": event.userId,
    "biddingId": event.biddingId,
    "scoreAtPrevReward": 0,
    "createdAt": Date.now()
  };

  var params = {
    TableName : config.tables.contributions,
    Item: newContribution
  };

  async.waterfall([
    function(waterfallCB) {
      biddingLib.getBidding({ id: event.biddingId }, waterfallCB);
    },
    function(bidding, waterfallCB) {
      if (bidding.status === 'Completed') return cb(new Error('400. bad request. bidding is complete, no more contributions please!'));
      usersLib.getUser({ id: event.userId }, waterfallCB);
    },
    function(response, waterfallCB) {
      user = response;
      if (protocol.notEnoughTokens(user)) return cb(new Error('400. bad request. not enough tokens for the contribution fee'));
      user = protocol.payContributionFee(user);
      util.log.info("User after contribution fee", user);
      usersLib.updateUser(user, waterfallCB);
    },
    function(response, waterfallCB) {
      db.put(params, waterfallCB);
    }
  ], function (err) {
    if (err)
      return cb(err);

    newContribution.contributorNewTokenBalance = user.tokens;
    cb(null, newContribution)
  });

}

function getContribution(event, cb) {

  var params = {
    TableName : config.tables.contributions,
    Key: { id: event.id }
  };

  return db.get(params, cb);
}

function getContributions(event, cb) {
  var toReturn = [];
  async.waterfall([
    function(waterfallCB) {
      var params = {
        TableName: config.tables.contributions,
        ConsistentRead: true,
        ReturnConsumedCapacity: "TOTAL"
      };
      db.scan(params, waterfallCB);
    },
    function(contributions, waterfallCB) {
      async.each(contributions, function(c, eachCB) {
        getContributionWithStats({id: c.id}, function(err, res) {
          toReturn.push(res);
          eachCB();
        });
      }, waterfallCB);
    }
  ], function(err, res) {
    cb(null, toReturn);
  });

}

function getContributionWithStats(event, cb) {
  var id = event.id;
  var evaluations;
  var evaluators;

  async.parallel({
    contribution: function(parallelCB) {
      getContribution(event, parallelCB);
    },
    evaluationsAndEvaluators: function(parallelCB) {
      async.waterfall([
        function(waterfallCB) {
          evaluationsLib.getEvaluationsByContribution(id, waterfallCB);
        },
        function(response, waterfallCB) {
          evaluations = response;
          // If there's no evaluations, skip fetching the evaluators
          if (evaluations.length) {
            usersLib.getEvaluators(evaluations, waterfallCB);
          } else { waterfallCB(); }
        },
        function(response, waterfallCB) {
          // If there's no evaluations, response will be empty, so we set empty array to pass to protocol function
          evaluators = response || [];
          parallelCB();
        }
      ]);
    },
    cachedRep: function(parallelCB) {
      getCachedRep(parallelCB);
    }
  }, function(err, response) {
    if (err) return cb(err);
    var contribution = response.contribution;
    var totalSystemRep = response.cachedRep.theValue;
    var protoStats = protocol.getStats(evaluations, evaluators, totalSystemRep)
    var toResponse = _.extend(contribution, protoStats);
    cb(null, toResponse);
  });
}

function getContributionScore(event, cb) {

  var users;
  var totalRep;
  async.waterfall([
      function(waterfallCB) {
        // get all evaluations from db
        getContributionEvaluations(event, waterfallCB);
      },
      function(evaluations, waterfallCB) {
        async.parallel({
            cachedRep: function(parallelCB) {
              getCachedRep(parallelCB);
            },
            evaluationsVoteOne: function(parallelCB) {
              evaluationsLib.getByContributionIdAndValue(event.id, 1, parallelCB);
            }
          },
          function(err, results) {
            totalRep = results.cachedRep.theValue;
            util.log.info("getContributionScore results : ", results);
            usersLib.getUsersByEvaluations(results.evaluationsVoteOne, waterfallCB);
          }
        );
      }
    ],
    function(err, result) {
      util.log.info("getContributionScore users : ", result);
      var score = protocol.calcUpScore(result, totalRep);
      return cb(err, score);
    }
  );
}

function getContributionEvaluations(event, cb) {

  var params = {
    TableName : config.tables.evaluations,
    IndexName: 'evaluations-contributionId-createdAt',
    KeyConditionExpression: 'contributionId = :hkey',
    ExpressionAttributeValues: { ':hkey': event.id }
  };

  db.query(params, cb);
}

function getContributionUsers(event, cb) {
  var response = [];
  return cb(null, response);
}

function deleteContribution(event, cb) {

  var params = {
    TableName : config.tables.contributions,
    Key: { id: event.id },
    ReturnValues: 'ALL_OLD'
  };

  return db.del(params, cb);
}

function addToMaxScore(id, newRep, cb) {
  var params = {
    TableName : config.tables.contributions,
    Key: { id: id },
    UpdateExpression: 'set #score = #score + :v',
    ExpressionAttributeNames: { '#score' : 'scoreAtPrevReward' },
    ExpressionAttributeValues: { ':v' : newRep },
    ReturnValues: 'ALL_NEW'
  }

  db.update(params, cb);
}