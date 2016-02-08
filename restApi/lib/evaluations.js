'use strict';

module.exports = {
  createEvaluation: createEvaluation,
  getEvaluation: getEvaluation,
  deleteEvaluation: deleteEvaluation
};

var async = require('async');
var util  = require('./helper');
var db    = require('./db');
var createSingleEvaluation = require('./createSingleEvaluation');

function createEvaluation(event, cb) {

  var params = {
    TableName : db.tables.evaluations,
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
    params.RequestItems[db.tables.evaluations] = submittedEvaluations;
    db.batchWrite(params, cb, responseArr);
  });

}

function getEvaluation(event, cb) {

  var params = {
    TableName : db.tables.evaluations,
    Key: { id: event.id }
  };

  return db.get(params, cb);
}

function deleteEvaluation(event, cb) {

  var params = {
    TableName : db.tables.evaluations,
    Key: { id: event.id },
    ReturnValues: 'ALL_OLD'
  };

  return db.del(params, cb);
}
