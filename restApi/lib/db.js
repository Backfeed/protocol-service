'use strict';

var _         = require('underscore');
var AWS       = require('aws-sdk');
var util      = require('./helper');
var dynamoDoc = getDynamoDoc();
var notFoundMsg = '404:Resource not found.';

var db = {
  put: put,
  get: get,
  query: query,
  scan: scan,
  update: update,
  del: del,
  batchGet: batchGet,
  batchWrite: batchWrite,
  tables: getTables()
};

module.exports = db;

function put(params, cb, respondSuffix) {
  util.log.profile('db put');
  return dynamoDoc.put(params, function(err, data) {
    if (respondSuffix && _.isEmpty(data)) data = respondSuffix;
    util.log.info(err, data);
    util.log.profile('db put');
    return cb(err, data);
  });
}

function get(params, cb) {
  util.log.profile('db get');
  return dynamoDoc.get(params, function(err, data) {
    util.log.info(err, data);
    if (err) return {}; //err;
    if (_.isEmpty(data)) return cb(notFoundMsg);
    util.log.profile('db get');
    return cb(err, data.Item);
  });
}

function query(params, cb) {
  util.log.profile('db query');
  return dynamoDoc.query(params, function(err, data) {
    if (_.isEmpty(data)) return cb(notFoundMsg);
    util.log.profile('db query');
    return cb(err, data.Items);
  });
}

function scan(params, cb) {
  util.log.profile('db scan');
  return dynamoDoc.scan(params, function(err, data) {
    if (_.isEmpty(data)) return cb(notFoundMsg);
    util.log.profile('db scan');
    return cb(err, data.Items);
  });
}

function update(params, cb) {
  util.log.profile('db update');
  return dynamoDoc.update(params, function(err, data) {
    util.log.info(err, data);
    if (_.isEmpty(data)) return cb(notFoundMsg);
    util.log.profile('db update');
    return cb(err, data.Attributes);
  });
}

function del(params, cb) {
  util.log.profile('db del');
  return dynamoDoc.delete(params, function(err, data) {
    util.log.info(err, data);
    if (_.isEmpty(data)) return cb(notFoundMsg);
    util.log.profile('db del');
    return cb(err, data.Attributes);
  });
}

function batchGet(params, cb, table) {
  util.log.profile('db batchGet');
  return dynamoDoc.batchGet(params, function(err, data) {
    util.log.profile('db batchGet');
    return cb(err, data.Responses[table]);
  });
}

function batchWrite(params, cb, responseValue) {
  util.log.profile('db batchWrite');
  return dynamoDoc.batchWrite(params, function(err, data) {
    util.log.profile('db batchWrite');
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

function getTables() {
  return {
    biddings: 'protocol-service-biddings-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    users: 'protocol-service-users-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    caching: 'protocol-service-caching-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    contributions: 'protocol-service-contributions-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    evaluations: 'protocol-service-evaluations-' + process.env.SERVERLESS_DATA_MODEL_STAGE
  };
}
