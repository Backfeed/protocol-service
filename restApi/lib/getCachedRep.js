var db      = require('./db');
var config  = require('./config');

module.exports = getCachedRep;

function getCachedRep(cb) {

  var params = {
    TableName : config.tables.caching,
    Key: { type: "totalRepInSystem" }
  };

  return db.get(params, cb);
}
