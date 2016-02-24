'use strict';

module.exports = {
  createEvaluation              : createEvaluation,
  getEvaluation                 : getEvaluation,
  deleteEvaluation              : deleteEvaluation,
  getByValue                    : getByValue,
  getByContributionIdAndValue   : getByContributionIdAndValue
};

var async                   = require('async');
var util                    = require('./helper');
var db                      = require('./db');
var config                  = require('./config');
var createSingleEvaluation  = require('./createSingleEvaluation');

function createEvaluation(event, cb) {

  var params = {
    TableName : config.tables.evaluations,
    RequestItems: {},
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE'
  };

  var submittedEvaluations = [];
  var responseArr = [];
  var dbEvaluationWrapper;

  async.each(event.evaluations, function(element, eachCB) {
    var newEvaluation = {
      "userId": event.userId,
      "biddingId": event.biddingId,
      "contributionId": element.contributionId,
      "value": element.value,
      "createdAt": Date.now()
    };

    async.waterfall([
      function(waterfallCB) {
        createSingleEvaluation.execute(newEvaluation, waterfallCB);
      }
    ],
      function(err, newEvalId) {
        if (err) {
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

  }, function(err) {
    util.log.info('iterate done');
    params.RequestItems[config.tables.evaluations] = submittedEvaluations;
    db.batchWrite(params, cb, responseArr);
  });

}

function getEvaluation(event, cb) {

  var params = {
    TableName : config.tables.evaluations,
    Key: { id: event.id }
  };

  return db.get(params, cb);
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
