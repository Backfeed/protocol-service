'use strict';

module.exports = {
  createUser: createUser,
  getUser: getUser,
  updateUser: updateUser,
  deleteUser: deleteUser,
  getUserEvaluations: getUserEvaluations,
  getUserContributions: getUserContributions
};

var util    = require('./helper');
var db      = require('./db');
var config  = require('./config');

function createUser(event, cb) {

  var newUser = {
    "id": util.uuid(),
    "tokens": event.tokens || parseFloat(process.env.USER_INITIAL_TOKENS),
    "reputation": event.reputation || parseFloat(process.env.USER_INITIAL_REPUTATION),
    "biddingCount": 0,
    "createdAt": Date.now()
  };

  var params = {
    TableName : config.tables.users,
    Item: newUser
  };

  return db.put(params, cb, newUser);
}

function getUser(event, cb) {

  var params = {
    TableName : config.tables.users,
    Key: { id: event.id }
  };

  return db.get(params, cb);
}

function getUserEvaluations(event, cb) {
  var params = {
    TableName : config.tables.evaluations,
    IndexName: 'evaluations-userId-createdAt',
    KeyConditionExpression: 'userId = :hkey',
    ExpressionAttributeValues: { ':hkey': event.id }
  };

  return db.query(params, cb);
}

function getUserContributions(event, cb) {

  var params = {
    TableName : config.tables.contributions,
    IndexName: 'contributions-by-userId-index',
    KeyConditionExpression: 'userId = :hkey',
    ExpressionAttributeValues: {
      ':hkey': event.id
    }
  };

  return db.query(params, cb);
}

function deleteUser(event, cb) {

  var params = {
    TableName : config.tables.users,
    Key: { id: event.id },
    ReturnValues: 'ALL_OLD'
  };

  return db.del(params, cb);
}

function updateUser(event, cb) {
  var params = {
    TableName: config.tables.users,
    Key: {
      id: event.id
    },
    UpdateExpression: 'set #tok = :t, #rep = :r',
    ExpressionAttributeNames: {'#tok' : 'tokens', '#rep' : 'reputation'},
    ExpressionAttributeValues: {
      ':t' : event.tokens,
      ':r' : event.reputation
    },
    ReturnValues: 'ALL_NEW'
  };

  return db.update(params, cb);
}
