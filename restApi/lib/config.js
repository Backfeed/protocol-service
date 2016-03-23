'use strict';

var config = {
  	tables: getTables(),
	USER_INITIAL_TOKENS: 100, 
	USER_INITIAL_REPUTATION: 0, 
	STAKE: 0.02, 
	ALPHA: 0.7, 
	GAMMA: 0.5, 
	TOKEN_REWARD_FACTOR: 15,
	REP_REWARD_FACTOR: 5,
	CONTRIBUTION_FEE: 1,
	DURATION: 86400000,
	DISTRIBUTION_STAKE: 0.08,
	REWARD_THRESHOLD: 0.3
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
