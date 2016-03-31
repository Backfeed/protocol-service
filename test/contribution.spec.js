var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _                 = require('underscore');
var chakram           = require('chakram');
var validator         = require('validator');
var util              = require('./util.js');
var config            = require('../restApi/lib/config.js');
var contributions     = require('../restApi/lib/contributions.js')

expect = chakram.expect;
var delta = 0.0005

describe("[CONTRIBUTION]", function() {
  var biddingId;
  var contribution1;
  var p1, p2, p3, p4, p5;
  var cachedRep;
  var arr = [];

  before('reset db, create 5 users, bidding, contribution', () => {
    console.log('BEFORE')
    console.log('Cleansing db ...')
    return util.cleanseDB()
      .then(res => {
        console.log('Creating users and bidding ...')
        arr = [
          util.user.createN(5),
          util.bidding.create()
        ];
        return chakram.all(arr);
      })
      .then(res => {
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

  it("should create a contribution", () => {
    return util.contribution.create({ userId: p1.id , biddingId: biddingId })
        .then(res => {
          contribution1 = res.body;
          expect(validator.isUUID(contribution1.id)).to.be.true;
          expect(validator.isUUID(contribution1.userId)).to.be.true;
          expect(validator.isUUID(contribution1.biddingId)).to.be.true;
          expect(contribution1.createdAt).to.be.a('number');
          expect(contribution1.maxScore).to.equal(0);
        });
  });

  it("getContributions should return a list of contributions", () => {
    return util.contribution.getContributions({})
      .then(res => {
        expect(res).to.have.status(200)
        expect(res.body).to.be.an('array')
        // we created one contribution before, which should show up here 
        expect(res.body).to.have.length(1)
        var contribution = res.body[0]
        expect(contribution).to.have.property('id')
        // expect(contribution).to.have.property('scorePercentage')
        // expect(contribution).to.have.property('totalVotedRep')
        // expect(contribution.scorePercentage).to.equal('xx')
        // expect(contribution.totalVotedRep).to.equal('xx')
        }
      )
  });

  describe("GET", () => {
    before("Create an evaluation for contribution 1", () => {
      return util.evaluation.createOne({
        userId: p1.id, 
        value: 1, 
        contributionId: contribution1.id
      }).then(res => {
        return chakram.wait()
      });
    });

    it('should get contribution with protocol properties', () => {
      return util.contribution.getWithProtoStats(contribution1.id)
        .then(res => {
          contribution1 = res.body;
          expect(validator.isUUID(contribution1.id)).to.be.true;
          expect(validator.isUUID(contribution1.userId)).to.be.true;
          expect(validator.isUUID(contribution1.biddingId)).to.be.true;
          expect(contribution1.createdAt).to.be.a('number');
          // implement after fixing max score at create evaluation function
          // expect(contribution1.maxScore).to.equal(0);
          expect(contribution1.score).to.be.closeTo(0.19778885, delta)
          expect(contribution1.totalVotedRep).to.be.closeTo(0.19778885, delta)
          expect(contribution1.scorePercentage).to.be.closeTo(0.1982271635, delta);
          expect(contribution1.totalVotedRepPercentage).to.be.closeTo(0.1982271635, delta);
        });
    });
  });
});