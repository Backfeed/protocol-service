'use strict';

/**
 * Serverless Module: Lambda Handler
 * - Your lambda functions should be a thin wrapper around your own separate
 * modules, to keep your code testable, reusable and AWS independent
 * - 'serverless-helpers-js' module is required for Serverless ENV var support.  Hopefully, AWS will add ENV support to Lambda soon :)
 */

// Require Serverless ENV vars
var ServerlessHelpers = require('serverless-helpers-js').loadEnv();

// Require Logic
var createSingleEvaluation = require('../../lib/createSingleEvaluation');

// Lambda Handler
module.exports.handler = function(event, context) {
  // currently used only for dmag, so bidding time is irrelevant, so we pass undefined
  createSingleEvaluation.execute(event, undefined, function(error, response) {
    return context.done(error, response);
  });

}
