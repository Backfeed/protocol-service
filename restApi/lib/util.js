'use strict';

module.exports = {
  cleanseDb: cleanseDb,
  syncCachedSystemRep: syncCachedSystemRep,
  cacheTotalUsersRep: cacheTotalUsersRep,
  updateCachedRep: updateCachedRep
};

var _       = require('underscore');
var async   = require('async');
var util    = require('./helper');
var db      = require('./db');
var config  = require('./config');
var math    = require('decimal.js');

function updateCachedRep(event, cb) {

  var params = {
    TableName: config.tables.caching,
    Key: { type: "totalRepInSystem" },
    UpdateExpression: 'set #val = :v',
    ExpressionAttributeNames: { '#val' : 'theValue' },
    ExpressionAttributeValues: { ':v' : event.reputation },
    ReturnValues: 'ALL_NEW'
  };

  return db.update(params, cb);
}

function addToCachedRep(reputation, cb) {
  util.log.info('addToCachedRep', reputation);
  var params = {
    TableName: config.tables.caching,
    Key: { type: "totalRepInSystem" },
    UpdateExpression: 'set #val = #val + :v',
    ExpressionAttributeNames: { '#val' : 'theValue' },
    ExpressionAttributeValues: { ':v' : reputation },
    ReturnValues: 'ALL_NEW'
  };

  //ExpressionAttributeValues: { ':v' : +math(reputation).abs().toDP(6, 3) },
  return db.update(params, cb);
}

function cacheTotalUsersRep(event, cb) {

  var params = {
    TableName: config.tables.users,
    ProjectionExpression:"reputation",
    ConsistentRead: true,
    ReturnConsumedCapacity: "TOTAL"
  };

  async.waterfall([
    function(waterfallCB) {
      db.scan(params, waterfallCB);
    },
    function(allUsersRep, waterfallCB) {
      var totalRep = util.sumRep(allUsersRep);
      updateCachedRep({ reputation: totalRep }, cb);
    }
  ]);
}

// This function gets called whenever there's a change on users table
function syncCachedSystemRep(event, cb) {
  var repToAdd = 0;
  var temp;
  var temp2;
  _.each(event.Records, function(record) {
    if (record.eventName === 'REMOVE') {
      temp = record.dynamodb.OldImage.reputation;
      repToAdd = +math.sub(repToAdd, math(temp.N || temp.S));

    } else if (record.eventName === 'INSERT') {
      temp = record.dynamodb.NewImage.reputation;
      repToAdd = +math.add(repToAdd, math(temp.N || temp.S));
    } else {
      temp = record.dynamodb.NewImage.reputation;
      temp2 = record.dynamodb.OldImage.reputation;
      var oldV = +math(temp2.N || temp2.S);
      var newV = +math(temp.N || temp.S);
      repToAdd = +math.add(repToAdd, math.sub(newV, oldV));
    }
  });
  return addToCachedRep(repToAdd, cb);
}

function cleanseDb(event, cb) {
  async.parallel([

    function(parallelCB) {
      async.waterfall([
        function(waterfallCB) {
          getAllItemsFromDb('users', waterfallCB);
        },
        function(users, waterfallCB) {
          deleteItemsFromDb(users, 'users', parallelCB);
        }
      ]);
    },

    function(parallelCB) {
      async.waterfall([
        function(waterfallCB) {
          getAllItemsFromDb('biddings', waterfallCB);
        },
        function(biddings, waterfallCB) {
          deleteItemsFromDb(biddings, 'biddings', parallelCB);
        }
      ]);
    },

    function(parallelCB) {
      async.waterfall([
        function(waterfallCB) {
          getAllItemsFromDb('contributions', waterfallCB);
        },
        function(contributions, waterfallCB) {
          deleteItemsFromDb(contributions, 'contributions', parallelCB);
        }
      ]);
    },

    function(parallelCB) {
      async.waterfall([
        function(waterfallCB) {
          getAllItemsFromDb('evaluations', waterfallCB);
        },
        function(evaluations, waterfallCB) {
          deleteItemsFromDb(evaluations, 'evaluations', parallelCB);
        }
      ]);
    }

  ], function(err, results) {
    cb(err, results);
  });
}

function getAllItemsFromDb(table, cb) {
  var params = {
    TableName: config.tables[table],
    ConsistentRead: true,
    ReturnConsumedCapacity: "TOTAL"
  };

  db.scan(params, cb);
}

function deleteItemsFromDb(xs, table, cb) {

  async.each(xs, function(x, asyncCB) {
    var params = {
      TableName : config.tables[table],
      Key: { id: x.id }
    };

    db.del(params, asyncCB);

  }, function(err) {
    cb(err, xs.length + ' ' + table + ' deleted');
  });

}
