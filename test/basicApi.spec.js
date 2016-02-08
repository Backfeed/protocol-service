var ServerlessHelpers   = require('serverless-helpers-js').loadEnv();
var _                   = require('underscore');
var chakram             = require('chakram');
var util                = require('./util');

expect = chakram.expect;

describe("Slant Protocol API", function() {

  before("Initialize things for the tests", function () {
  });

  //after('reset db', function() {
  //  return util.cleanseDB().then(function(res) {
  //    return chakram.wait();
  //  });
  //});

  xit("should return 201 on success", function () {
    return expect(util.user.create()).to.have.status(201);
  });

  xit("should return 200 when finding a user", function () {
    return expect(util.user.create(userId)).to.have.status(200);
  });

  xit("should return 404 when not finding a user", function () {
    var nonUserGET = util.user.get('1');
    return expect(nonUserGET).to.have.status(404);
  });

  describe("play with some users data", function () {

    // Users
    var george, paul, john, ringo, pete;

    // Biddings
    var abbey, white, revolver, pepper;

    // Contributions
    var something, blackbird, taxman, lucy;

    // Evaluations
    var georgeEvalIdOfsomething;

    before("Initialize things for the tests", function () {
    });

    it("should create the beatles - Users", function () {
      var multipleResponses = [];

      _.times(5, function(n) { multipleResponses.push(util.user.create()) });

      return chakram.all(multipleResponses).then(function(responses) {
        var users = util.toBodies(responses);
        george = users[0];
        paul   = users[1];
        john   = users[2];
        ringo  = users[3];
        pete   = users[4];

        expect(george.createdAt).to.be.a('number');
        expect(paul.tokens).to.equal(11);
        expect(john.id).to.have.length.above(2);
        expect(ringo.reputation).to.equal(0.2);
      });
    });

    it("should create albums - Biddings", function () {
      var multipleResponses = [];
      _.times(4, function(n) { multipleResponses.push(util.bidding.create()) });
      return chakram.all(multipleResponses).then(function(responses) {
        var biddings = util.toBodies(responses);
        abbey    = biddings[0];
        white    = biddings[1];
        revolver = biddings[2];
        pepper   = biddings[3];
        expect(abbey.createdAt).to.be.a('number');
        expect(white.status).to.equal('InProgress');
        expect(revolver.id).to.have.length.above(2);
      });
    });

    it("should create song titles - Contributions", function () {
      var multipleResponses = [
        util.contribution.create({ 'userId': george.id, 'biddingId': abbey.id }),
        util.contribution.create({ 'userId': paul.id, 'biddingId': white.id }),
        util.contribution.create({ 'userId': john.id, 'biddingId': revolver.id }),
        util.contribution.create({ 'userId': ringo.id, 'biddingId': pepper.id })
      ];
      return chakram.all(multipleResponses).then(function(responses) {
        var contributions = util.toBodies(responses);
        something = contributions[0];
        blackbird = contributions[1];
        taxman    = contributions[2];
        lucy      = contributions[3];
        expect(something.createdAt).to.be.a('number');
        expect(blackbird.userId).to.equal(paul.id);
        expect(taxman.biddingId).to.equal(revolver.id);
        expect(lucy.id).to.have.length.above(2);
        return chakram.wait();
      });
    });

    it("should create george evaluation for something - Evaluations", function () {
      return util.evaluation.create({
        'userId': george.id,
        'biddingId': abbey.id,
        'evaluations': [{
          'contributionId': something.id,
          'value': 1
        }]
      }).then(function(res) {
        georgeEvalIdOfsomething = res.body[0];
        expect(georgeEvalIdOfsomething).to.have.length.above(14);
        expect(georgeEvalIdOfsomething).to.be.a('string');
        return util.evaluation.get(georgeEvalIdOfsomething);
      }).then(function(res) {
        var eval = res.body;
        expect(eval.id).to.be.equal(georgeEvalIdOfsomething);
        expect(eval.value).to.be.equal(1);
        return chakram.wait();
      });
    });

    it("should change george vote for something - Evaluations", function () {
      return util.evaluation.create({
        'userId': george.id,
        'biddingId': abbey.id,
        'evaluations': [{
          'contributionId': something.id,
          'value': 0
        }]
      }).then(function(res) {
        console.log(res);
        expect(res.body[0]).to.be.equal(georgeEvalIdOfsomething);
        return util.evaluation.get(georgeEvalIdOfsomething);
      }).then(function(res) {
        console.log(res);
        var eval = res.body;
        expect(eval.id).to.be.equal(georgeEvalIdOfsomething);
        expect(eval.value).to.be.equal(0);
        return chakram.wait();
      });
    });

    xit("should clean things up", function () {
      var multipleResponses = [
        util.user.delete(george.id),
        util.bidding.delete(abbey.id),
        util.contribution.delete(something.id),
        util.evaluation.delete(georgeEvalIdOfsomething),
      ];
      return chakram.all(multipleResponses).then(function(responses) {
        var deletions = util.toBodies(responses);
        expect(deletions[0].id).to.be.equal(george.id);
        expect(deletions[1].id).to.be.equal(abbey.id);
        expect(deletions[2].id).to.be.equal(something.id);
        expect(deletions[3].id).to.be.equal(georgeEvalIdOfsomething);
      });
    });
  });
});
