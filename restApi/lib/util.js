'use strict';

module.exports = {
  cleanseDb: cleanseDb,
  syncCachedSystemRep: syncCachedSystemRep,
  cacheTotalUsersRep: cacheTotalUsersRep,
  updateCachedRep: updateCachedRep
};

var _     = require('underscore');
var async = require('async');
var util  = require('./helper');
var db    = require('./db');

function updateCachedRep(event, cb) {

  var params = {
    TableName: util.tables.caching,
    Key: { type: "totalRepInSystem" },
    UpdateExpression: 'set #val = :v',
    ExpressionAttributeNames: { '#val' : 'theValue' },
    ExpressionAttributeValues: { ':v' : event.reputation },
    ReturnValues: 'ALL_NEW'
  };

  return db.update(params, cb);
}

function addToCachedRep(reputation, cb) {
  util.log.info('addToCachedRep pp', util.pp(reputation));
  var params = {
    TableName: util.tables.caching,
    Key: { type: "totalRepInSystem" },
    UpdateExpression: 'set #val = #val + :v',
    ExpressionAttributeNames: { '#val' : 'theValue' },
    ExpressionAttributeValues: { ':v' : util.pp(reputation) },
    ReturnValues: 'ALL_NEW'
  };

  return db.update(params, cb);
}

function cacheTotalUsersRep(event, cb) {

  var params = {
    TableName: util.tables.users,
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

// This function gets called whenever there1's a change on users table
function syncCachedSystemRep(event, cb) {
  var repToAdd = 0;
  var temp;
  var temp2;
  _.each(event.Records, function(record) {
    if (record.eventName === 'REMOVE') {
      temp = record.dynamodb.OldImage.reputation;
      repToAdd = util.math.sub(repToAdd, new util.math(temp.N || temp.S).toNumber()).toNumber();

    } else if (record.eventName === 'INSERT') {
      temp = record.dynamodb.NewImage.reputation;
      repToAdd = util.math.add(repToAdd, new util.math(temp.N || temp.S).toNumber()).toNumber();
    } else {
      temp = record.dynamodb.NewImage.reputation;
      temp2 = record.dynamodb.OldImage.reputation;
      var oldV = new util.math(temp2.N || temp2.S).toNumber();
      var newV = new util.math(temp.N || temp.S).toNumber();
      repToAdd = util.math.add(repToAdd, util.math.sub(newV, oldV).toNumber()).toNumber();
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
    TableName: util.tables[table],
    ConsistentRead: true,
    ReturnConsumedCapacity: "TOTAL"
  };

  db.scan(params, cb);
}

function deleteItemsFromDb(xs, table, cb) {

  async.each(xs, function(x, asyncCB) {
    var params = {
      TableName : util.tables[table],
      Key: { id: x.id }
    };

    db.del(params, asyncCB);

  }, function(err) {
    cb(err, xs.length + ' ' + table + ' deleted');
  });

}
