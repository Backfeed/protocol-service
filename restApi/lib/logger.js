var w  = require('winston');
require('winston-loggly');

w.add(w.transports.Loggly, {
  inputToken: "58eb8773-b227-496a-916b-bc5f48653382",
  subdomain: "jankei",
  tags: ["Winston-NodeJS"],
  json:true
});

var winston = {
  winston: w
};

module.exports = winston;
