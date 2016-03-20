var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _                 = require('underscore');
var chakram           = require('chakram');
var util              = require('./util.js');

expect = chakram.expect;

describe.only("Test protocol according to excel", function() {
  var biddingId;
  var contributionId1;
  var contributionId2;
  var p1, p2, p3, p4, p5;
  var cachedRep;
  var arr = [];

  before('reset db, create 5 users and a bidding', function() {
    return util.cleanseDB()
      .then(function(res) {
        arr = [
          util.user.createN(5),
          util.bidding.create()
        ];
        return chakram.all(arr);
      })
      .then(function(res) {
        var users = res[0];
        biddingId = res[1].body.id;
        p1 = users[0];
        p2 = users[1];
        p3 = users[2];
        p4 = users[3];
        p5 = users[4];
        return chakram.wait();
      });
  });

  //after('reset db', function() {
  //  return util.cleanseDB().then(function(res) {
  //    return chakram.wait();
  //  });
  //});

  it("should cost tokens for submitting a contribution", function () {
    arr = [
      util.contribution.create({ userId: p1.id , biddingId: biddingId }),
      util.contribution.create({ userId: p2.id , biddingId: biddingId })
    ];
    return chakram.all(arr)
      .then(function(res) {
        contributionId1 = res[0].body.id;
        contributionId2 = res[1].body.id;
        return util.user.get(p1.id);
      })
      .then(function(res) {
        p1 = res.body;
        console.log("p1 : ", p1);
        expect(p1.tokens).to.be.equal(10);
        return chakram.wait();
      });
  });

  it("should distribute rep according to step 1", function() {
    return util.evaluation.create({
        biddingId: biddingId,
        userId: p1.id,
        evaluations: [{ contributionId: contributionId1, value: 1 }]
      })
      .then(function(res) {
        console.log("evaluation : ", res.body);
        arr = [
          util.user.get(p1.id),
          util.user.get(p2.id),
          util.user.get(p3.id),
          util.user.get(p4.id),
          util.user.get(p5.id)
        ];
        return chakram.all(arr);
      }).then(function(res) {
        p1 = res[0].body;
        p2 = res[1].body;
        p3 = res[2].body;
        p4 = res[3].body;
        p5 = res[4].body;
        console.log("p1 : ", p1);
        console.log("p2 : ", p2);
        console.log("p3 : ", p3);
        console.log("p4 : ", p4);
        console.log("p5 : ", p5);
        expect(p1.reputation).to.be.closeTo(0.196437, 0.000005);
        return util.delayedGetCachedRep();
      }).then(function(res) {
        console.log("totalRep : ", res.body.theValue);
        expect(res.body.theValue).to.be.closeTo(0.996437, 0.000005);
        return chakram.wait();
      });
  });

  it("should distribute rep according to step 2", function() {
    return util.evaluation.create({
      biddingId: biddingId,
      userId: p2.id,
      evaluations: [{ contributionId: contributionId1, value: 0 }]
    }).then(function(res) {
      console.log("evaluation : ", res.body);
      arr = [
        util.user.get(p1.id),
        util.user.get(p2.id),
        util.user.get(p3.id),
        util.user.get(p4.id),
        util.user.get(p5.id)
      ];
      return chakram.all(arr);
    }).then(function(res) {
      p1 = res[0].body;
      p2 = res[1].body;
      p3 = res[2].body;
      p4 = res[3].body;
      p5 = res[4].body;
      console.log("p1 : ", p1);
      console.log("p2 : ", p2);
      console.log("p3 : ", p3);
      console.log("p4 : ", p4);
      console.log("p5 : ", p5);
      expect(p1.reputation).to.be.closeTo(0.198428, 0.000005);
      expect(p2.reputation).to.be.closeTo(0.196452, 0.000005);
      return util.delayedGetCachedRep();
    }).then(function(res) {
      cachedRep = res.body.theValue;
      console.log("totalRep : ", res.body.theValue);
      expect(cachedRep).to.be.closeTo(0.994880, 0.000005);
    });
  });

  it("should distribute rep according to step 3", function() {
    return util.evaluation.create({
      biddingId: biddingId,
      userId: p3.id,
      evaluations: [{ contributionId: contributionId1, value: 1 }]
    }).then(function(res) {
      console.log("evaluation : ", res.body);
      arr = [
        util.user.get(p1.id),
        util.user.get(p2.id),
        util.user.get(p3.id),
        util.user.get(p4.id),
        util.user.get(p5.id)
      ];
      return chakram.all(arr);
    }).then(function(res) {
      p1 = res[0].body;
      p2 = res[1].body;
      p3 = res[2].body;
      p4 = res[3].body;
      p5 = res[4].body;
      console.log("p1 : ", p1);
      console.log("p2 : ", p2);
      console.log("p3 : ", p3);
      console.log("p4 : ", p4);
      console.log("p5 : ", p5);
      expect(p1.reputation).to.be.closeTo(0.194881, 0.000005);
      expect(p2.reputation).to.be.closeTo(0.196452, 0.000005);
      return util.delayedGetCachedRep();
    }).then(function(res) {
      cachedRep = res.body.theValue;
      console.log("totalRep : ", res.body.theValue);
      expect(cachedRep).to.be.closeTo(0.991333, 0.000005);
    });
  });

  it("should distribute rep according to step 4", function() {
    return util.evaluation.create({
      biddingId: biddingId,
      userId: p4.id,
      evaluations: [{ contributionId: contributionId2, value: 1 }]
    }).then(function(res) {
      console.log("evaluation : ", res.body);
      arr = [
        util.user.get(p1.id),
        util.user.get(p2.id),
        util.user.get(p3.id),
        util.user.get(p4.id),
        util.user.get(p5.id)
      ];
      return chakram.all(arr);
    }).then(function(res) {
      p1 = res[0].body;
      p2 = res[1].body;
      p3 = res[2].body;
      p4 = res[3].body;
      p5 = res[4].body;
      console.log("p1 : ", p1);
      console.log("p2 : ", p2);
      console.log("p3 : ", p3);
      console.log("p4 : ", p4);
      console.log("p5 : ", p5);
      expect(p1.reputation).to.be.closeTo(0.200013, 0.000005);
      expect(p2.reputation).to.be.closeTo(0.198454, 0.000005);
      expect(p3.reputation).to.be.closeTo(0.195165, 0.000005);
      return util.delayedGetCachedRep();
    }).then(function(res) {
      cachedRep = res.body.theValue;
      console.log("totalRep : ", res.body.theValue);
      expect(cachedRep).to.be.closeTo(0.993632, 0.000005);
    });
  });

  it("should distribute rep according to step 5", function() {
    return util.evaluation.create({
      biddingId: biddingId,
      userId: p5.id,
      evaluations: [{ contributionId: contributionId2, value: 0 }]
    }).then(function(res) {
      console.log("evaluation : ", res.body);
      arr = [
        util.user.get(p1.id),
        util.user.get(p2.id),
        util.user.get(p3.id),
        util.user.get(p4.id),
        util.user.get(p5.id)
      ];
      return chakram.all(arr);
    }).then(function(res) {
      p1 = res[0].body;
      p2 = res[1].body;
      p3 = res[2].body;
      p4 = res[3].body;
      p5 = res[4].body;
      console.log("p1 : ", p1);
      console.log("p2 : ", p2);
      console.log("p3 : ", p3);
      console.log("p4 : ", p4);
      console.log("p5 : ", p5);
      expect(p1.reputation).to.be.closeTo(0.204674, 0.000005);
      expect(p2.reputation).to.be.closeTo(0.200472, 0.000005);
      expect(p3.reputation).to.be.closeTo(0.199713, 0.000005);
      expect(p4.reputation).to.be.closeTo(0.194559, 0.000005);
      return util.delayedGetCachedRep();
    }).then(function(res) {
      cachedRep = res.body.theValue;
      console.log("totalRep : ", res.body.theValue);
      expect(cachedRep).to.be.closeTo(0.999418, 0.000005);
    });
  });

  it("should distribute rep according to step 6", function() {
    return util.evaluation.create({
      biddingId: biddingId,
      userId: p1.id,
      evaluations: [{ contributionId: contributionId2, value: 1 }]
    }).then(function(res) {
      console.log("evaluation : ", res.body);
      arr = [
        util.user.get(p1.id),
        util.user.get(p2.id),
        util.user.get(p3.id),
        util.user.get(p4.id),
        util.user.get(p5.id)
      ];
      return chakram.all(arr);
    }).then(function(res) {
      p1 = res[0].body;
      p2 = res[1].body;
      p3 = res[2].body;
      p4 = res[3].body;
      p5 = res[4].body;
      console.log("p1 : ", p1);
      console.log("p2 : ", p2);
      console.log("p3 : ", p3);
      console.log("p4 : ", p4);
      console.log("p5 : ", p5);
      expect(p1.reputation).to.be.closeTo(0.206743, 0.000005);
      expect(p2.reputation).to.be.closeTo(0.205699, 0.000005);
      expect(p3.reputation).to.be.closeTo(0.201731, 0.000005);
      expect(p4.reputation).to.be.closeTo(0.196525, 0.000005);
      expect(p5.reputation).to.be.closeTo(0.195114, 0.000005);
      return util.delayedGetCachedRep();
    }).then(function(res) {
      cachedRep = res.body.theValue;
      console.log("totalRep : ", res.body.theValue);
      expect(cachedRep).to.be.closeTo(1.005812, 0.000005);
    });
  });

 

});
