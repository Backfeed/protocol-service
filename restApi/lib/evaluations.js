'use strict';

module.exports = {
  createEvaluation              : createEvaluation,
  getEvaluation                 : getEvaluation,
  getEvaluations                : getEvaluations,
  deleteEvaluation              : deleteEvaluation,
  getByValue                    : getByValue,
  getByContributionIdAndValue   : getByContributionIdAndValue,
  getEvaluationsByContribution  : getEvaluationsByContribution
};

var async                   = require('async');
var util                    = require('./helper');
var db                      = require('./db');
var config                  = require('./config');
var createSingleEvaluation  = require('./createSingleEvaluation');
var biddingLib              = require('./biddings');

function createEvaluation(event, cb) {
  // batch creates a set of evaluations
  // expects an 'event' of the following form:
  //     "evaluations": [
  //       {
  //         "contributionId": "1ffabd01-7a6d-4cd0-b6c6-f2480a583c06",
  //         "value": 1
  //       },
  //       {
  //         "contributionId": "1f18938f-6eb3-4908-91e0-cf0ca5b2afd1",
  //         "value": 1
  //       }
  //     ],
  //     "userId": "a384ba35-841b-4510-a53a-c63b377055c6",
  //     "biddingId": "183d1187-e1b6-4f7e-bf61-f42555127032"
  //   }
  //

  var params = {
    TableName : config.tables.evaluations,
    RequestItems: {},
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE'
  };

  var submittedEvaluations = [];
  var responseArr = [];
  var dbEvaluationWrapper;

  async.waterfall([
    function(waterfallCB) {
      biddingLib.getBidding({ id: event.biddingId }, waterfallCB);
    },
    function(bidding) {
      async.each(event.evaluations, function (element, eachCB) {
          var newEvaluation = {
            "userId": event.userId,
            "biddingId": event.biddingId,
            "contributionId": element.contributionId,
            "value": element.value,
            "createdAt": Date.now()
          };

          async.waterfall([
              function (waterfallCB) {
                createSingleEvaluation.execute(newEvaluation, bidding.createdAt, waterfallCB);
              }
            ],
            function (err, newEvalId) {
              if (err) {
          // why?
                responseArr.push(err);
              } else {
                newEvaluation.id = newEvalId;
                dbEvaluationWrapper = {
                  PutRequest: {
                    Item: newEvaluation
                  }
                };
                submittedEvaluations.push(dbEvaluationWrapper);
                responseArr.push(newEvaluation.id);
              }
              eachCB(null);
            }
          );

        },
        function (err) {
          util.log.info('iterate done');
          params.RequestItems[config.tables.evaluations] = submittedEvaluations;
          db.batchWrite(params, cb, responseArr);
        });
    }
    ]);
}

function getEvaluation(event, cb) {

  var params = {
    TableName : config.tables.evaluations,
    Key: { id: event.id }
  };
  return db.get(params, cb);
}

function getEvaluations(event, cb) {

  var contributionId = event.contributionId
  var params = {
    TableName : config.tables.evaluations,
    IndexName: 'evaluations-contributionId-createdAt',
    KeyConditionExpression: 'contributionId = :hkey',
    ExpressionAttributeValues: { ':hkey': contributionId }
  };
  return db.scan(params, cb);
}


function deleteEvaluation(event, cb) {

  var params = {
    TableName : config.tables.evaluations,
    Key: { id: event.id },
    ReturnValues: 'ALL_OLD'
  };

  return db.del(params, cb);
}

function getByValue(biddingId, votedValue, cb) {
  var params = {
    TableName : config.tables.evaluations,
    IndexName: 'evaluations-biddingId-value',
    ExpressionAttributeNames: { '#v': 'value' }, // Need to do this since 'value' is a reserved dynamoDB word
    KeyConditionExpression: 'biddingId = :bkey and #v = :v',
    ExpressionAttributeValues: {
      ':bkey': biddingId,
      ':v': votedValue
    }
  };

  return db.query(params, cb);
}

function getByContributionIdAndValue(contributionId, votedValue, cb) {
  var params = {
    TableName : config.tables.evaluations,
    IndexName: 'evaluations-contributionId-value',
    ExpressionAttributeNames: { '#v': 'value' },
    KeyConditionExpression: 'contributionId = :bkey and #v = :v',
    ExpressionAttributeValues: {
      ':bkey': contributionId,
      ':v': votedValue
    }
  };

  return db.query(params, cb);
}


function getEvaluationsByContribution(contributionId, cb) {
  // TODO: replace this with getEvaluations({'contributionId': contributionId}, cb)
  // when that function is written.
  var params = {
    TableName : config.tables.evaluations,
    IndexName: 'evaluations-contributionId-createdAt',
    KeyConditionExpression: 'contributionId = :hkey',
    ExpressionAttributeValues: { ':hkey': contributionId }
  };

  return db.query(params, cb);
}

