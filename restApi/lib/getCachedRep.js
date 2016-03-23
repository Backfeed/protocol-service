var db      = require('./db');
var config  = require('./config');

module.exports = getCachedRep;

function getCachedRep(cb) {
	/* returns the total reputation in the system */
  var params = {
    TableName : config.tables.caching,
    Key: { type: "totalRepInSystem" }
  };

  return db.get(params, cb);
}
