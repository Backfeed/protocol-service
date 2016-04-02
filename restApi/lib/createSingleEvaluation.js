'use strict';

var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _                 = require('underscore');
var async             = require('async');
var util              = require('./helper');
var getCachedRep      = require('./getCachedRep');
var protocol          = require('./protocol');
var usersLib          = require('./users');
var evaluationsLib    = require('./evaluations');
var contributionsLib  = require('./contributions');

// Lambda Handler
module.exports.execute = function(event, bidCreationTime, cb) {

  util.log.info('event', event);

  var contributionId = event.contributionId;
  var userId = event.userId;
  var value = event.value;

  var cachedRep;
  var evaluations;
  var evaluators;
  var newEvalId;
  var contribution;

  async.waterfall([

    function(waterfallCB) {
      async.parallel({
        cachedRep: function(parallelCB) {
          getCachedRep(parallelCB);
        },
        evaluations: function(parallelCB) {
          evaluationsLib.getEvaluationsByContribution(contributionId, parallelCB);
        },
        contribution: function(parallelCB) {
          contributionsLib.getContribution({id:contributionId}, parallelCB);
        }
      }, waterfallCB);
    },

    function(results, waterfallCB) {
      cachedRep = results.cachedRep.theValue;
      evaluations = results.evaluations;
      contribution = results.contribution;

      var currentUserFormerEvaluation = _.findWhere(evaluations, { userId: userId });

      if (!!currentUserFormerEvaluation) {

        if (currentUserFormerEvaluation.value === value) {
          return cb(new Error('400: bad request. current user already evaluated this contribution with this value'));
        }

        newEvalId = currentUserFormerEvaluation.id;

        util.log.info('current user already evaluated this contribution, removing his vote');
        evaluations = _.reject(evaluations, function(e) {
          return e.userId === userId;
        });

      } else {
        newEvalId = util.uuid();
      }

      evaluations.push(event);
      usersLib.getEvaluators(evaluations, waterfallCB);

    },

    function(response, waterfallCB) {
      evaluators = response;
      var currentUser = _.findWhere(evaluators, {id:userId});
      var newRep = currentUser.reputation;
      var protoResponse = protocol.evaluate(userId, newRep, value, evaluators, evaluations, cachedRep, bidCreationTime, contribution.scoreAtPrevReward, contribution.userId);
      evaluators = protoResponse.evaluators;

      async.parallel({
        updateEvaluatorsRep: function(parallelCB) {
          usersLib.updateEvaluatorsRepToDb(evaluators, parallelCB);
        },
        updateContriubtionMaxScore: function(parallelCB) {
          return parallelCB();
          // TODO :: implement with check if score got up, and award contributor if passed threshold
          // if (value === 1) {
          //   contributionsLib.addToMaxScore(contributionId, newRep, parallelCB);
          // } else {
          //   parallelCB();
          // }
        }
      }, waterfallCB)

    }

  ],
    function(err, result) {
      // todo :: different responses for slant and dmag
      var contributionScore = protocol.calcUpScore(evaluators, cachedRep);
      var toResponse = {id: newEvalId, contributionScore: contributionScore}
      return cb(err, toResponse);
    }
  );

};