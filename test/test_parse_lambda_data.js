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
      config_file: 'config.json',
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
  })
})
