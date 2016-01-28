var expect = require('expect')
var fs = require('fs')
var tmp = require('tmp')
var path = require('path')
var copy_to_temp = require('../copy_to_temp')
describe('copy_to_temp', function () {
  beforeEach(function () {
    this.tmp_source = tmp.dirSync({unsafeCleanup: true})
  })
  afterEach(function () {
    this.tmp_source.removeCallback()
  })

  context('empty directory', function () {
    context('no options', function () {
      it('does nothing', function (done) {
        copy_to_temp(this.tmp_source.name, function (err, tmp_dir) {
          if (err) {
            done(err)
            return null
          }
          expect(tmp_dir).toNotExist()
          done()
        })
      })
    })

    context('with options', function () {
      it('does nothing', function (done) {
        copy_to_temp(this.tmp_source.name, { exclude: ['test'] }, function (err, tmp_dir) {
          if (err) {
            done(err)
            return null
          }
          expect(tmp_dir).toNotExist()
          done()
        })
      })
    })
  })
  context('populated directory', function () {
    beforeEach(function () {
      fs.mkdirSync(path.join(this.tmp_source.name, 'test'))
      fs.mkdirSync(path.join(this.tmp_source.name, 'content'))
      fs.writeFileSync(path.join(this.tmp_source.name, 'things.txt'), 'some things')
      fs.writeFileSync(path.join(this.tmp_source.name, 'test', 'stuff.js'), 'var stuff = \'stuff\'')
      fs.writeFileSync(path.join(this.tmp_source.name, 'content', 'index.html'), '<html></html>')
    })
    context('no options', function () {
      it('copies everything', function (done) {
        copy_to_temp(this.tmp_source.name, function (err, tmp_dir) {
          if (err) {
            done(err)
            return null
          }
          expect(tmp_dir).toExist()
          try {
            var files = fs.readdirSync(tmp_dir)
            var test_files = fs.readdirSync(path.join(tmp_dir, 'test'))
            var content_files = fs.readdirSync(path.join(tmp_dir, 'content'))
          } catch (e) {
            done(e)
            return null
          }
          expect(files.length).toEqual(3)
          expect(files).toInclude('test')
          expect(files).toInclude('content')
          expect(files).toInclude('things.txt')
          expect(test_files).toEqual(['stuff.js'])
          expect(content_files).toEqual(['index.html'])
          done()
        })
      })
    })
    context('with options', function () {
      it('skips excluded content', function (done) {
        copy_to_temp(this.tmp_source.name, { exclude: ['test'] }, function (err, tmp_dir) {
          if (err) {
            done(err)
          }
          expect(tmp_dir).toExist()
          try {
            var files = fs.readdirSync(tmp_dir)
            var content_files = fs.readdirSync(path.join(tmp_dir, 'content'))
          } catch (e) {
            done(e)
            return null
          }
          expect(files.length).toEqual(2)
          expect(files).toInclude('content')
          expect(files).toInclude('things.txt')
          expect(content_files).toEqual(['index.html'])
          done()
        })
      })
    })
  })
})
