var util  = require('./helper');
var db    = require('./db');

module.exports = getCachedRep;

function getCachedRep(cb) {

  var params = {
    TableName : util.tables.caching,
    Key: { type: "totalRepInSystem" }
  };

  return db.get(params, cb);
}
