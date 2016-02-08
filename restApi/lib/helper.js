'use strict';

var logger = require('./logger');
var _      = require('underscore');
var uuid   = require('node-uuid');
var math   = require('decimal.js');

var util = {
  tables: getTables(),
  uuid  : uuid.v4,
  sumRep: sumRep,
  math  : math,
  log   : logger.log
};

module.exports = util;

function getTables() {
  return {
    biddings: 'protocol-service-biddings-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    users: 'protocol-service-users-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    caching: 'protocol-service-caching-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    contributions: 'protocol-service-contributions-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    evaluations: 'protocol-service-evaluations-' + process.env.SERVERLESS_DATA_MODEL_STAGE
  };
}

function sumRep(users) {
  return _.reduce(users, function(memo, user) {
    return math.add(memo, user.reputation).toNumber();
  }, 0);
}

