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
  pp    : parseProtocol,
  log   : logger.log
};

module.exports = util;

function getTables() {
  return {
    biddings: 'slant-biddings-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    users: 'slant-users-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    caching: 'slant-caching-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    contributions: 'slant-contributions-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    evaluations: 'slant-evaluations-' + process.env.SERVERLESS_DATA_MODEL_STAGE
  };
}

function sumRep(users) {
  return _.reduce(users, function(memo, user) {
    return math.add(memo, user.reputation).toNumber();
  }, 0);
}

function parseProtocol(n) {
  return math.round(n).toNumber();
}
