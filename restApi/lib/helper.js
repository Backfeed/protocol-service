'use strict';

var logger = require('./logger');
var _      = require('underscore');
var uuid   = require('node-uuid');
var math   = require('decimal.js');

var util = {
  uuid  : uuid.v4,
  sumRep: sumRep,
  math  : math,
  log   : logger.log
};

module.exports = util;

function sumRep(users) {
  return _.reduce(users, function(memo, user) {
    return math.add(memo, user.reputation).toNumber();
  }, 0);
}

