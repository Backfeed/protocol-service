'use strict';

var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _                 = require('underscore');
var async             = require('async');
var Immutable         = require('immutable');
var util              = require('./helper');
var getCachedRep      = require('./getCachedRep');
var protocol          = require('./protocol');
var usersLib          = require('./users');
var evaluationsLib    = require('./evaluations');
var contributionsLib  = require('./contributions');

// Lambda Handler
module.exports.execute = function(event, bidCreationTime, cb) {

  util.log.info('event', event);

  var iMap = Immutable.Map({
    voteRep: 0,
    contributionRep: 0,
    cachedRep: 0
  });

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
          evaluationsLib.getEvaluationsByContribution(event.contributionId, parallelCB);
        }
      },
        function(err, results) {
          waterfallCB(err, results);
        }
      );
    },

    function(results, waterfallCB) {
      iMap = iMap.set('cachedRep', results.cachedRep.theValue);
      evaluations = results.evaluations;

      var currentUserFormerEvaluation = _.findWhere(evaluations, { userId: event.userId });

      if (!!currentUserFormerEvaluation) {

        if (currentUserFormerEvaluation.value === event.value) {
          return cb(new Error('400: bad request. current user already evaluated this contribution with this value'));
        }

        newEvalId = currentUserFormerEvaluation.id;

        util.log.info('current user already evaluated this contribution, removing his vote');
        evaluations = _.reject(evaluations, function(e) {
          return e.userId === event.userId;
        });

      } else {
        newEvalId = util.uuid();
      }

      evaluations.push(event);
      usersLib.getEvaluators(evaluations, waterfallCB);

    },

    function(evaluators, waterfallCB) {
      var currentUser = getCurrentUserFrom(evaluators, event.userId);
      var newRep = currentUser.reputation;
      evaluators = protocol.evaluate(event.userId, newRep, event.value, evaluators, evaluations, iMap.get('cachedRep'), bidCreationTime);
      async.parallel({
        updateEvaluatorsRep: function(parallelCB) {
          usersLib.updateEvaluatorsRepToDb(evaluators, parallelCB);
        },
        updateContriubtionMaxScore: function(parallelCB) {
          if (event.value === 1) {
            contributionsLib.addToMaxScore(event.contributionId, newRep, parallelCB);
          } else {
            parallelCB();
          }
        }
      }, waterfallCB)

    }

  ],
    function(err, result) {
      return cb(err, newEvalId);
    }
  );

};

function getCurrentUserFrom(evaluators, currentUserId) {
  return _.find(evaluators, function(evaluator) {
    return evaluator.id === currentUserId;
  });
}