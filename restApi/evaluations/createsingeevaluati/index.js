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
    newEvaluation.id = res.id;

    var params = {
      TableName : config.tables.evaluations,
      Item: newEvaluation
    };

    var toReturn = JSON.parse(JSON.stringify(newEvaluation))
    toReturn.contributionScore

    db.put(params, function(err) {
      if (err) return cb(err);
      newEvaluation.contributionScore = res.contributionScore;
      cb(null, newEvaluation);
    });

  });
}