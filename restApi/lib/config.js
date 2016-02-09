'use strict';

var config = {
  tables: getTables()
};

module.exports = config;

function getTables() {
  return {
    biddings      : 'protocol-service-biddings-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    users         : 'protocol-service-users-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    caching       : 'protocol-service-caching-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    contributions : 'protocol-service-contributions-' + process.env.SERVERLESS_DATA_MODEL_STAGE,
    evaluations   : 'protocol-service-evaluations-' + process.env.SERVERLESS_DATA_MODEL_STAGE
  };
}
