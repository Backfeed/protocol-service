var _                      = require('underscore');
var createSingleEvaluation = require('../../lib/createSingleEvaluation');
var config                 = require('../../lib/config');
var db                     = require('../../lib/db');
var util                   = require('../../lib/helper');

module.exports = func;

function func(event, cb) {

  var newEvaluation = {
    "userId": event.userId,
    "contributionId": event.contributionId,
    "value": event.value,
    "createdAt": Date.now()
  };

  createSingleEvaluation.execute(newEvaluation, undefined, function(err, res) {
    // the ID might be a new one if it's the first evaluation of this 
    // user on this contribution, or it's the id of the former evaluation if exists
    newEvaluation.id = res.id

    var params = {
      TableName : config.tables.evaluations,
      Item: newEvaluation
    };

    db.put(params, function(err) {
      if (err) return cb(err);
      
      newEvaluation = _.extend(newEvaluation, res)
      cb(null, newEvaluation);
    });

  });
}