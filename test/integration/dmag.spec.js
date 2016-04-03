'use strict';

var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _                 = require('underscore');
var chakram           = require('chakram');
var util              = require('../util.js');
var config            = require('../../restApi/lib/config.js');

var expect = chakram.expect;

describe("Test protocol according to excel", () => {
  var allowedDeviation = 0.00005;
  var results = require('../dmag.results.js');
  var biddingId;
  var contributions = [];
  var contributionId1;
  var contributionId2;
  var users;

  before('reset db, create 5 users and a bidding', beforeInit);

  it("should set cachedRep to sum of users reputation", () => {
    // we delay this to let AWS event to be processed
    return util.delayedGetCachedRep().then(res => {
      expect(res.body.theValue).to.be.closeTo(100, allowedDeviation);
    });
  });

  it("should cost tokens for submitting a contribution", function () {
    let step = 0;

    return chakram.all([
      util.contribution.create({ userId: users[1].id , biddingId: biddingId }),
      util.contribution.create({ userId: users[2].id , biddingId: biddingId })
      ])
      .then(res => {
        contributions = res.map(r=>r.body)
        contributionId1 = res[0].body.id;
        contributionId2 = res[1].body.id;
      })
      .then(()=>assertStep(step))
  });

  //                                           user, contrib, val
  //                                           u, c, v
  it("should evaluate step 1", () => doStep(1, 1, 1, 1) );
  it("should evaluate step 2", () => doStep(2, 2, 1, 0) );
  it("should evaluate step 3", () => doStep(3, 3, 1, 1) );
  it("should evaluate step 4", () => doStep(4, 4, 2, 1) );
  it("should evaluate step 5", () => doStep(5, 5, 2, 0) );
  it("should evaluate step 6", () => doStep(6, 1, 2, 1) );
  it("should evaluate step 7", () => doStep(7, 2, 1, 1) );
  it("should evaluate step 8", () => doStep(8, 3, 1, 0) );
  // fix rewarding mechanism after delta hasbeen crossed!
  it("should evaluate step 9", () => doStep(9, 4, 1, 1) );
  xit("should evaluate step 10", () => doStep(10, 5, 2, 1) );



  function doStep(step, uN, cN, value, debug) {
    let user = users[uN-1];
    let uid = user.id;
    let cid = contributions[cN-1].id;

    return util.evaluation.createOne({
        userId: uid,
        contributionId: cid, 
        value: value
      })
      .then(()=>assertStep(step, debug))
  }



  function beforeInit() {
    return util.cleanseDB()
      .then(res => {
        var promises = [
          util.user.createN(5),
          util.bidding.create()
        ];
        return chakram.all(promises);
      })
      .then(res => {
        users = res[0];
        biddingId = res[1].body.id;
        return chakram.wait();
      });
  }

  function assertStep(step, debug) {
    return chakram.all(getUsers(users))
      .then(res => {
        users = res.map(r=>r.body);

        let expected = results[String(step)];

        for (let i=0; i<users.length; i++) {
          let u = users[i];
          let r = expected.users[i];

          if (debug)
            util.debugStep(u, r);

          expect(u.reputation).to.be.closeTo(r.reputation, allowedDeviation);
          expect(u.tokens).to.be.closeTo(r.tokens, allowedDeviation);
        }
        return chakram.wait();
      });
  }

});

function getUsers(users) {
  return users.map(u=>u.id)
              .map(util.user.get);
}

function debugStep(u, r) {
  util.shout("uid:", u.id, '\nrep:', u.reputation, r.reputation, '\ntokens:', u.tokens, r.tokens);
}