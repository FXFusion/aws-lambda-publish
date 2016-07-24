var mockery = require('mockery')
var expect = require('expect')
var path = require('path')
var tmp = require('tmp')
describe('aws-lambda-publish', function () {
  var Publisher
  var mock_child_process = {
    exec: function (command, options, cb) {
      cb(null)
    }
  }
  before(function () {
    mockery.enable()
    mockery.warnOnUnregistered(false)
    mockery.registerMock('child_process', mock_child_process)
    Publisher = require('../index')
  })
  after(function () {
    mockery.disable
  })
  beforeEach(function () {
    this.tmp_dir = tmp.dirSync({ unsafeCleanup: true })
  })
  afterEach(function () {
    this.tmp_dir.removeCallback()
  })
  describe('constructor', function () {
    it('should create an object', function () {
      expect(new Publisher()).toExist()
    })
  })
  describe('instance methods', function () {
    beforeEach(function () {
      this.publisher = new Publisher()
    })
    describe('.publish', function () {
      it('should fail if given a directory that does not exist', function (done) {
        var fake_path = path.join(this.tmp_dir.name, 'fake')
        this.publisher.publish(fake_path, function (err, data) {
          expect(err).toExist()
          done()
        })
      })
      it('should not fail if given a directory that exists', function (done) {
        console.log('Temp dir ' + this.tmp_dir.name)
        this.publisher.publish(this.tmp_dir.name, function (err, data) {
          done(err)
        })
      })
      context('with contents', function () {
        it('should not fail', function (done) {
          this.publisher.publish(this.tmp_dir.name, function (err, data) {
            done(err)
          })
        })
      })
    })
    describe('.package', function () {
      it('should not fail if given directory that exists', function (done) {
        this.publisher.package(this.tmp_dir.name, function (err, data) {
          done(err)
        })
      })
    })
  })
})
