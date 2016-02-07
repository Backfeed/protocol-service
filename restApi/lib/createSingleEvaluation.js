'use strict';

var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _         = require('underscore');
var async     = require('async');
var util      = require('../../util');
var db        = require('../../util/db');
var getCachedRep = require('../../util/getcachedrep');
var Immutable = require('immutable');
var protocol  = require('../../util/protocol');

// Lambda Handler
module.exports.execute = function(event, cb) {

  util.log.debug('event', event);

  var iMap = Immutable.Map({
    newRep: 0,
    voteRep: 0,
    contributionRep: 0,
    cachedRep: 0
  });

  var startTime = new Date().getTime();

  var evaluations;
  var evaluators;
  var newEvalId;

  async.waterfall([

    function(waterfallCB) {
      async.parallel({
        cachedRep: function(parallelCB) {
          getCachedRep(parallelCB);
        },
        evaluations: function(parallelCB) {
          getEvaluations(event.contributionId, parallelCB);
        }
      },
        function(err, results) {
          waterfallCB(err, results);
        }
      );
    },

    function(results, waterfallCB) {
      iMap = iMap.set('cachedRep', results.cachedRep.theValue);
      util.log.debug('cachedRep', iMap.get('cachedRep'));
      evaluations = results.evaluations;

      var currentUserFormerEvaluation = _.findWhere(evaluations, { userId: event.userId });

      if (!!currentUserFormerEvaluation) {

        if (currentUserFormerEvaluation.value === event.value) {
          return cb(new Error('400: bad request. current user already evaluated this contribution with this value'));
        }

        newEvalId = currentUserFormerEvaluation.id;

        util.log.debug('current user already evaluated this contribution, removing his vote');
        evaluations = _.reject(evaluations, function(e) {
          return e.userId === event.userId;
        });

      } else {
        newEvalId = util.uuid();
      }

      evaluations.push(event);
      util.log.debug('evaluations', evaluations);
      getEvaluators(evaluations, waterfallCB);

    },

    function(result, waterfallCB) {
      evaluators = result;

      evaluators = protocol.evaluate(event.userId, event.value, evaluators, evaluations, iMap.get('cachedRep'));

      updateEvaluatorsRepToDb(evaluators, waterfallCB);
    }

  ],
    function(err, result) {
      return cb(err, newEvalId);
    }
  );

};

function updateEvaluatorsRepToDb(evaluators, cb) {
  var params = {
    TableName: db.tables.users,
    RequestItems: {},
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE'
  };
  var submittedEvaluators = [];
  _.each(evaluators, function(evaluator) {
    var dbEvaluatorsWrapper = {
      PutRequest: { Item: evaluator }
    };
    submittedEvaluators.push(dbEvaluatorsWrapper);
  });

  params.RequestItems[db.tables.users] = submittedEvaluators;

  return db.batchWrite(params, cb);
}

function getEvaluations(contributionId, cb) {
  var params = {
    TableName : db.tables.evaluations,
    IndexName: 'evaluations-contributionId-createdAt',
    KeyConditionExpression: 'contributionId = :hkey',
    ExpressionAttributeValues: { ':hkey': contributionId }
  };

  return db.query(params, cb);
}

function getEvaluators(evaluations, cb) {

  var params = {
    RequestItems: {}
  };

  var Keys = _.map(evaluations, function(evaluation) {
    return { id: evaluation.userId };
  });

  Keys = _.uniq(Keys, function(item, key, a) {
    return item.id;
  });

  params.RequestItems[db.tables.users] = {
    Keys: Keys
  };

  return db.batchGet(params, cb, db.tables.users);
}
