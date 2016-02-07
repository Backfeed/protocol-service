'use strict';

module.exports = {
  createContribution: createContribution,
  getContribution: getContribution,
  getContributionEvaluations: getContributionEvaluations,
  getContributionUsers: getContributionUsers,
  deleteContribution: deleteContribution
};

var async      = require('async');
var util       = require('./helper');
var db         = require('./db');
var biddingLib = require('./biddings');
var usersLib   = require('./users');

function createContribution(event, cb) {

  var newContribution = {
    "id": util.uuid(),
    "userId": event.userId,
    "biddingId": event.biddingId,
    "createdAt": Date.now()
  };

  var params = {
    TableName : db.tables.contributions,
    Item: newContribution
  };

  //TODO contribution fee (param = 1) if not enough token throw error and prevent creation
  var contributionFee = 1;

  async.waterfall([
    function(waterfallCB) {
      biddingLib.getBidding({ id: event.biddingId }, waterfallCB);
    },
    function(bidding, waterfallCB) {
      if (bidding.status === 'Completed') return cb(new Error('400. bad request. bidding is complete, no more contributions please!'));
      usersLib.getUser({ id: event.userId }, waterfallCB);
    },
    function(user, waterfallCB) {
      if (user.tokens < contributionFee) return cb(new Error('400. bad request. not enough tokens for the contribution fee'));
      user.tokens -= contributionFee;
      usersLib.updateUser(user, waterfallCB);
    },
    function() {
      return db.put(params, cb, newContribution);
    }
  ]);

}

function getContribution(event, cb) {

  var params = {
    TableName : db.tables.contributions,
    Key: { id: event.id }
  };

  return db.get(params, cb);
}

function getContributionEvaluations(event, cb) {

  var params = {
    TableName : db.tables.evaluations,
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
    TableName : db.tables.contributions,
    Key: { id: event.id },
    ReturnValues: 'ALL_OLD'
  };

  return db.del(params, cb);
}
