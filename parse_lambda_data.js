var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var async = require('async')
var Private = {
  parse_manifest: function (root_path, opts, cb) {
    var new_manifest = _.defaultsDeep({}, opts.manifest)
    if (!opts.manifest_file) {
      cb(null, new_manifest)
      return null
    }
    fs.readFile(path.join(root_path, opts.manifest_file), function (err, data) {
      if (err) {
        cb(null, new_manifest)
        return null
      }
      var manifest_from_file = JSON.parse(data)
      _.defaults(new_manifest, manifest_from_file)
      cb(null, new_manifest)
    })
  },
  parse_config: function (root_path, opts, cb) {
    var new_config = _.defaultsDeep({}, opts.config)
    var configPath = path.join(root_path, opts.config_file)
    var isConfigFolder = function () {
      var isFolder = false
      try {
        var lstat = fs.lstatSync(configPath)
        isFolder = lstat.isDirectory()
      } catch (e) {
        isFolder = false
      }
      return isFolder
    }
    var isConfigFile = function () {
      var configFilePath = configPath + '.json'
      var isFile = false
      try {
        isFile = fs.lstatSync(configFilePath).isFile()
      } catch (_e) {
        isFile = false
      }
      return isFile
    }
    if (!opts.config_file) {
      cb(null, new_config)
      return null
    }
    if (isConfigFolder()) {
      Private.parseConfigFromFolder(configPath, opts, cb)
    } else if (isConfigFile()) {
      Private.parseConfigFromFile(configPath + '.json', opts, cb)
    } else {
      cb(null, new_config)
      return null
    }
  },
  parseConfigFromFile: function (configPath, opts, cb) {
    var newConfig = _.defaultsDeep({}, opts.config)
    fs.readFile(path.join(configPath), function (err, data) {
      if (err) {
        cb(null, newConfig)
        return null
      }
      var configFromFile = JSON.parse(data)
      _.defaults(newConfig, configFromFile)
      cb(null, newConfig)
    })
  },
  parseConfigFromFolder: function (configPath, opts, cb) {
    var newConfig = _.defaultsDeep({}, opts.config)
    var configFilePath = path.join(configPath, opts.stage + '.json')
    fs.readFile(configFilePath, function (err, data) {
      if (err) {
        cb(null, newConfig)
        return null
      }
      var configFromFile = JSON.parse(data)
      _.defaults(newConfig, configFromFile)
      cb(null, newConfig)
    })
  },
  write_config: function (root_path, config, cb) {
    var config_content = JSON.stringify(config)
    var config_path = path.join(root_path, 'config.json')
    fs.writeFile(config_path, config_content, cb)
  }
}
module.exports = function (source, opts, cb) {
  var on_data_parsed = function (err, data) {
    if (err) {
      cb(err)
      return null
    }
    opts.config = data[1]
    opts.manifest = data[0]
    Private.write_config(source, data[1], function (err, data) {
      if (err) {
        cb(err)
        return null
      }
      cb(null, [opts.config, opts.manifest])
    })
  }
  async.parallel([
    function (done) {
      Private.parse_manifest(source, opts, function (err, manifest) {
        if (err) {
          done(err)
          return null
        }
        done(null, manifest)
      })
    },
    function (done) {
      Private.parse_config(source, opts, function (err, config) {
        if (err) {
          done(err)
          return null
        }
        done(null, config)
      })
    }
  ], on_data_parsed)
}
