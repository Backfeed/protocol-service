'use strict';

var logger = require('./logger');
var _      = require('underscore');
var uuid   = require('node-uuid');
var math   = require('decimal.js');

var util = {
  uuid  : uuid.v4,
  sumRep: sumRep,
  math  : math,
  shout : shout,
  log   : {info: ()=>{}}
};

module.exports = util;

function sumRep(users) {
  return _.reduce(users, function(memo, user) {
    return +math.add(memo, user.reputation);
  }, 0);
}

function shout() {
  console.log('\n\n**************************')
  console.log.apply(null, arguments);
  console.log('**************************\n\n')
}