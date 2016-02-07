var _ = require('underscore');
var chakram = require('chakram');
var expect = chakram.expect;
var util = require('./util');

describe('end bidding', function() {

  var p1;
  var p2;
  var arr;
  var biddingId;
  var contributionId1;
  var contributionId2;

  before('setup 2 users, 1 bidding and 2 contributions', function() {
    return util.cleanseDB()
      .then(function() {
        arr = [
          util.user.createN(2),
          util.bidding.create()
        ];
        return chakram.all(arr);
      })
      .then(function(res) {
        var users = res[0];
        p1 = users[0];
        p2 = users[1];
        biddingId = res[1].body.id;
        arr = [
          util.contribution.create({ userId: p1.id, biddingId: biddingId }),
          util.contribution.create({ userId: p2.id, biddingId: biddingId })
        ];
        return chakram.all(arr);
      })
      .then(function(res) {
        var contributions = util.toBodies(res);
        contributionId1 = contributions[0].id;
        contributionId2 = contributions[1].id;
        arr = [
          util.evaluation.create({
            userId: p1.id,
            biddingId: biddingId,
            evaluations: [
              { contributionId: contributionId1, value: 1 },
              { contributionId: contributionId2, value: 1 }
            ]
          }),
          util.evaluation.create({
            userId: p2.id,
            biddingId: biddingId,
            evaluations: [
              { contributionId: contributionId1, value: 1 },
              { contributionId: contributionId2, value: 0 }
            ]
          })
        ];
        return chakram.all(arr).then(function() {
          return chakram.wait();
        });
      });
  });

  it('should get bidding with score', function() {
    return util.bidding.get(biddingId)
      .then(function(res) {
        var bidding = res.body;
        expect(bidding.id).to.be.equal(biddingId);
        expect(bidding.status).to.be.equal('InProgress');
        expect(bidding.winningContributionId).to.be.a('string');
        expect(bidding.winningContributionId).to.have.length.above(30);
        expect(bidding.createdAt).to.be.a('number');
        expect(bidding.endedAt).to.be.undefined;
        expect(bidding.winningContributionScore).to.be.equal(0.404248);
        return chakram.wait();
      });
  });

  it('should declare contribution1 as winner and reward p1', function() {
    return util.bidding.end(biddingId)
      .then(function(res) {
        var bidding = res.body;
        expect(bidding.id).to.be.equal(biddingId);
        expect(bidding.status).to.be.equal('Completed');
        expect(bidding.winningContributionId).to.be.a('string');
        expect(bidding.winningContributionId).to.have.length.above(30);
        expect(bidding.createdAt).to.be.a('number');
        expect(bidding.endedAt).to.be.a('number');
        expect(bidding.endedAt).to.be.greaterThan(bidding.createdAt);
        return util.user.get(p1.id);
      }).then(function(res) {
        p1 = res.body;
        expect(p1.tokens).to.be.equal(21);
        expect(p1.reputation).to.be.equal(10.202124);
        return chakram.wait();
      });
  });

  it('should reject ending a Completed bidding', function() {
    return util.bidding.end(biddingId)
      .then(function(res) {
        // TODO :: change to status code 400 and proper error message after handling error responses
        expect(res.body).to.be.equal('Internal Server Error');
        return chakram.wait();
      });
  });

  it('should reject submitting a contribution to a Completed bidding', function() {
    return util.contribution.create({ biddingId: biddingId, userId: p1.id })
      .then(function(res) {
        // TODO :: change to status code 400 and proper error message after handling error responses
        expect(res.body).to.be.equal('Internal Server Error');
        return chakram.wait();
      });
  });

});