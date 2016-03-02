var expect = require('expect')
var tmp = require('tmp')
var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var package_lambda = require('../package_lambda')
var Adm_zip = require('adm-zip')
describe('package_lambda', function () {
  beforeEach(function () {
    this.tmp_dir = tmp.dirSync({ unsafeCleanup: true })
    this.source_folder = path.join(this.tmp_dir.name, 'test_lambda')
    fs.mkdirSync(this.source_folder)
    fs.writeFileSync(path.join(this.source_folder, 'index.js'), 'var hello = "hello"')
  })
  afterEach(function () {
    this.tmp_dir.removeCallback()
  })
  describe('source only', function () {
    it('should create a zip in the source directory', function (done) {
      var self = this
      package_lambda({ source: this.source_folder }, function (err, data) {
        try {
          var zip = new Adm_zip(path.join(self.source_folder, 'test_lambda.zip'))
          var entries = _.map(zip.getEntries(), function(entry) { return entry.entryName })
          expect(entries).toInclude('index.js')
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })
  describe('source and dest', function () {
    beforeEach(function () {
      this.tmp_dest = tmp.dirSync({ unsafeCleanup: true })
      this.dest_folder = this.tmp_dest.name
    })
    afterEach(function () {
      this.tmp_dest.removeCallback()
    })
    it('should create a zip in the dest directory', function (done) {
      var self = this
      package_lambda({ source: this.source_folder, dest: this.dest_folder }, function (err, data) {
        try {
          var zip = new Adm_zip(path.join(self.dest_folder, 'test_lambda.zip'))
          var entries = _.map(zip.getEntries(), function(entry) { return entry.entryName })
          expect(entries).toInclude('index.js')
          done()
        } catch (e) {
          done(e)
        }
      })
    })
    describe('with explicit name', function () {
      it('should create a zip in the dest directory', function (done) {
        var self = this
        package_lambda({ source: this.source_folder,
                         dest: this.dest_folder,
                         name: 'my_lambda' }, function (err, data) {
          try {
            var zip = new Adm_zip(path.join(self.dest_folder, 'my_lambda.zip'))
            var entries = _.map(zip.getEntries(), function(entry) { return entry.entryName })
            expect(entries).toInclude('index.js')
            done()
          } catch (e) {
            done(e)
          }
        })
      })
    })
  })
})
