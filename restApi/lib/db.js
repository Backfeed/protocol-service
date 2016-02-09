'use strict';

var _         = require('underscore');
var AWS       = require('aws-sdk');
var util      = require('./helper');
var dynamoDoc = getDynamoDoc();
var notFoundMsg = '404:Resource not found.';

var db = {
  put         : put,
  get         : get,
  query       : query,
  scan        : scan,
  update      : update,
  del         : del,
  batchGet    : batchGet,
  batchWrite  : batchWrite
};

module.exports = db;

function put(params, cb, respondSuffix) {
  var nStartTime = Date.now();
  return dynamoDoc.put(params, function(err, data) {
    if (respondSuffix && _.isEmpty(data)) data = respondSuffix;
    var nEndTime = Date.now();
    util.log.info('DB PUT Elapsed time: ' + String(nEndTime - nStartTime) + ' milliseconds');
    util.log.info(err, data);
    return cb(err, data);
  });
}

function get(params, cb) {
  var nStartTime = Date.now();
  return dynamoDoc.get(params, function(err, data) {
    util.log.info(err, data);
    if (err) return {}; //err;
    if (_.isEmpty(data)) return cb(notFoundMsg);
    var nEndTime = Date.now();
    util.log.info('DB GET Elapsed time: ' + String(nEndTime - nStartTime) + ' milliseconds');
    return cb(err, data.Item);
  });
}

function query(params, cb) {
  var nStartTime = Date.now();
  return dynamoDoc.query(params, function(err, data) {
    if (_.isEmpty(data)) return cb(notFoundMsg);
    var nEndTime = Date.now();
    util.log.info('DB Query Elapsed time: ' + String(nEndTime - nStartTime) + ' milliseconds');
    return cb(err, data.Items);
  });
}

function scan(params, cb) {
  var nStartTime = Date.now();
  return dynamoDoc.scan(params, function(err, data) {
    if (_.isEmpty(data)) return cb(notFoundMsg);
    var nEndTime = Date.now();
    util.log.info('DB Scan Elapsed time: ' + String(nEndTime - nStartTime) + ' milliseconds');
    return cb(err, data.Items);
  });
}

function update(params, cb) {
  var nStartTime = Date.now();
  return dynamoDoc.update(params, function(err, data) {
    util.log.info(err, data);
    if (_.isEmpty(data)) return cb(notFoundMsg);
    var nEndTime = Date.now();
    util.log.info('DB UPDATE Elapsed time: ' + String(nEndTime - nStartTime) + ' milliseconds');
    return cb(err, data.Attributes);
  });
}

function del(params, cb) {
  var nStartTime = Date.now();
  return dynamoDoc.delete(params, function(err, data) {
    util.log.info(err, data);
    if (_.isEmpty(data)) return cb(notFoundMsg);
    var nEndTime = Date.now();
    util.log.info('DB DEL Elapsed time: ' + String(nEndTime - nStartTime) + ' milliseconds');
    return cb(err, data.Attributes);
  });
}

function batchGet(params, cb, table) {
  var nStartTime = Date.now();
  return dynamoDoc.batchGet(params, function(err, data) {
    var nEndTime = Date.now();
    util.log.info('DB batchGet Elapsed time: ' + String(nEndTime - nStartTime) + ' milliseconds');
    return cb(err, data.Responses[table]);
  });
}

function batchWrite(params, cb, responseValue) {
  var nStartTime = Date.now();
  return dynamoDoc.batchWrite(params, function(err, data) {
    var nEndTime = Date.now();
    util.log.info('DB batchWrite Elapsed time: ' + String(nEndTime - nStartTime) + ' milliseconds');
    return cb(err, responseValue);
  });
}

function getDynamoDoc() {
  var dynamoConfig = {
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region:       process.env.AWS_REGION
  };
  return new AWS.DynamoDB.DocumentClient(dynamoConfig);
}
