var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'backfeed'});
var logger = {
  log: log
};

module.exports = logger;
