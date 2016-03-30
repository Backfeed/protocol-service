'use strict';

var config = {
  	tables: getTables(),
	USER_INITIAL_TOKENS: 100,  // number of tokens a user gets on creation
	// TODO: this should be 0 (but it will break some tests)
	USER_INITIAL_REPUTATION: 0.2, // initial reputation in percentage 
	CONTRIBUTION_FEE: 1, // fee of contribution in tokens
	REWARD_THRESHOLD: 0.3, // the treshold in percentage of upvotes after which users get rewarded
	// if a user gets 100% upvotes, he should be rewarded USER_INITIAL_TOKENS
	TOKEN_REWARD_FACTOR: 50, 
	STAKE: 0.02, 
	ALPHA: 0.7, 
	GAMMA: 0.5, 
	REP_REWARD_FACTOR: 5,
	DURATION: 86400000,
	DISTRIBUTION_STAKE: 0.08
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
