'use strict';

var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
var _                 = require('underscore');
var chakram           = require('chakram');
var validator         = require('validator');
var util              = require('./util.js');
var config            = require('../restApi/lib/config.js');
var contributions     = require('../restApi/lib/contributions.js')

var expect = chakram.expect;
var delta = 0.0005

describe("[CONTRIBUTION]", function() {
  var biddingId;
  var contribution1;
  var contribution2;
  var p1, p2, p3, p4, p5;
  var cachedRep;
  var arr = [];


  before('reset db, create 5 users, bidding', () => {
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

  xit("should create a contribution", () => {
    return util.contribution.create({ userId: p1.id , biddingId: biddingId })
        .then(res => {
          contribution1 = res.body;
          expect(validator.isUUID(contribution1.id)).to.be.true;
          expect(validator.isUUID(contribution1.userId)).to.be.true;
          expect(validator.isUUID(contribution1.biddingId)).to.be.true;
          expect(contribution1.createdAt).to.be.a('number');
          expect(contribution1.scoreAtPrevReward).to.equal(0);
          expect(contribution1.contributorNewTokenBalance).to.equal(config.USER_INITIAL_TOKENS - config.CONTRIBUTION_FEE);
        });
  });

  it("getContributions should return a list of contributions", () => {
    return util.contribution.getContributions({})
      .then(res => {
        expect(res).to.have.status(200)
        expect(res.body).to.be.an('array')
        expect(res.body).to.have.length(0)
        }
      )
  });
  xit("should get contribution with score 0 when no evaluations", () => {
    return util.contribution.getWithProtoStats(contribution1.id)
      .then(res => {
        contribution1 = res.body;
        expect(validator.isUUID(contribution1.id)).to.be.true;
        expect(validator.isUUID(contribution1.userId)).to.be.true;
        expect(validator.isUUID(contribution1.biddingId)).to.be.true;
        expect(contribution1.createdAt).to.be.a('number');
        expect(contribution1.scoreAtPrevReward).to.equal(0);
        expect(contribution1.score).to.equal(0)
        expect(contribution1.scorePercentage).to.equal(0);
        expect(contribution1.engagedRep).to.equal(0);
        expect(contribution1.engagedRepPercentage).to.equal(0);
      });
  });
  describe("GET", () => {
    before("Create an evaluation for contribution 1", () => {
      // TODO: we get a "cannot read property id of undefined" error here
      // return util.evaluation.createOne({
      //   userId: p1.id, 
      //   value: 1, 
      //   contributionId: contribution1.id
      // }).then(res => {
      //   return chakram.wait()
      // });
    });

    xit('should get contribution with protocol properties', () => {
      return util.contribution.getWithProtoStats(contribution1.id)
        .then(res => {
          contribution1 = res.body;
          expect(validator.isUUID(contribution1.id)).to.be.true;
          expect(validator.isUUID(contribution1.userId)).to.be.true;
          expect(validator.isUUID(contribution1.biddingId)).to.be.true;
          expect(contribution1.createdAt).to.be.a('number');
          expect(contribution1.scoreAtPrevReward).to.equal(0);
          expect(contribution1.score).to.be.a('number')
          expect(contribution1.scorePercentage).to.be.a('number');
          expect(contribution1.engagedRep).to.be.a('number')
          expect(contribution1.engagedRepPercentage).to.be.a('number');
        });
    });
  });

  describe('GET ALL', () => {
    before('make second contribution', () => {
      return util.contribution.create({ userId: p2.id , biddingId: biddingId })
          .then(res => contribution2 = res.body);
    })

    it('should get both contributions', () => {
      return util.contribution.getAll().then(res => {
        let c1 = res.body[0];
        let c2 = res.body[1];
        let contribs = [c1, c2];

        for (let i=0; i<contribs; i++) {
          let c = contribs[i];
          expect(validator.isUUID(c.id)).to.be.true;
          expect(validator.isUUID(c.userId)).to.be.true;
          expect(validator.isUUID(c.biddingId)).to.be.true;
          expect(c.createdAt).to.be.a('number');
          expect(c.scoreAtPrevReward).to.equal(0);
          expect(c.score).to.be.a('number')
          expect(c.scorePercentage).to.be.a('number');
          expect(c.engagedRep).to.be.a('number')
          expect(c.engagedRepPercentage).to.be.a('number');
        }

      });
    });
  });

});
