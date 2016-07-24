var expect = require('expect')
var fs = require('fs')
var tmp = require('tmp')
var path = require('path')
var _ = require('lodash')
var parse_lambda_data = require('../parse_lambda_data')
describe('parse_lambda_data', function () {
  beforeEach(function () {
    this.tmp_dir = tmp.dirSync({ unsafeCleanup: true })
    this.opts = {
      config_file: 'config',
      manifest_file: 'function_manifest.json',
      config: {},
      manifest: {}
    }
  })
  afterEach(function () {
    this.tmp_dir.removeCallback()
  })
  context('no config/manifest file, valid options provided', function () {
    beforeEach(function () {
      _.defaults(this.opts.manifest, { name: 'my_function', region: 'us-west-2', role: 'arn:aws:fake_role' })
      _.defaults(this.opts.config, { config_key: 'config_value' })
    })
    it('should write a config.json file', function (done) {
      var self = this
      parse_lambda_data(this.tmp_dir.name, this.opts, function (err, data) {
        if (err) {
          done(err)
          return null
        }
        try {
          var config_file_content = fs.readFileSync(path.join(self.tmp_dir.name, 'config.json'))
        } catch (e) {
          done(e)
          return null
        }
        var parsed_config = JSON.parse(config_file_content)
        expect(parsed_config).toEqual(self.opts.config)
        done()
      })
    })
    it('should return manifest data', function (done) {
      var self = this
      parse_lambda_data(this.tmp_dir.name, this.opts, function (err, data) {
        if (err) {
          done(err)
          return null
        }
        expect(data[1]).toEqual(self.opts.manifest)
        done()
      })
    })
  })
  context('config for multiple stages', function () {
    beforeEach(function () {
      var configPath = path.join(this.tmp_dir.name, 'config')
      this.devConfig = {
        name: 'foo'
      }
      this.stageConfig = {
        name: 'bar'
      }
      this.opts.stage = 'dev'
      fs.mkdirSync(configPath)
      fs.writeFileSync(path.join(configPath, 'dev.json'), JSON.stringify(this.devConfig))
      fs.writeFileSync(path.join(configPath, 'stage.json'), JSON.stringify(this.stageConfig))
      _.defaults(this.opts.manifest, { name: 'my_function', region: 'us-west-2', role: 'arn:aws:fake_role' })
    })
    it('should write the stage config', function (done) {
      var self = this
      parse_lambda_data(this.tmp_dir.name, this.opts, function (err, data) {
        if (err) {
          done(err)
          return null
        }
        try {
          var config_file_content = fs.readFileSync(path.join(self.tmp_dir.name, 'config.json'))
        } catch (e) {
          done(e)
          return null
        }
        var parsed_config = JSON.parse(config_file_content)
        expect(parsed_config).toEqual(self.devConfig)
        done()
      })
    })
    context('stage config does not exist', function () {
      beforeEach(function () {
        this.opts.stage = 'prod'
        this.opts.config = { name: 'foobar'}
      })
      it('should write default config', function (done) {
        var self = this
        parse_lambda_data(this.tmp_dir.name, this.opts, function (err, data) {
          if (err) {
            done(err)
            return null
          }
          try {
            var config_file_content = fs.readFileSync(path.join(self.tmp_dir.name, 'config.json'))
          } catch (e) {
            done(e)
            return null
          }
          var parsed_config = JSON.parse(config_file_content)
          expect(parsed_config).toEqual(self.opts.config)
          done()
        })
      })
    })
  })
})
