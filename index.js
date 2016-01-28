var path = require('path')
var fs = require('fs-extra')
var _ = require('lodash')
var parse_lambda_data = require('./parse_lambda_data')
var package_lambda = require('./package_lambda')
var copy_to_temp = require('./copy_to_temp')
var async = require('async')
var exec = require('child_process').exec
var Private = {
  set_root: function (root) {
    var root_folder = path.resolve(root)
    var root_stats
    try {
      root_stats = fs.lstatSync(root_folder)
    } catch (e) {
      throw new Error(root_folder + ' does not exist')
    }

    if (!root_stats.isDirectory()) {
      throw new Error(root_folder + ' is not a directory')
    }
    return root_folder
  },
  default_options: {
    exclude: ['test', 'node_modules'],
    manifest_file: './function_manifest.json',
    manifest_options: {},
    config_file: './config.json',
    config_options: {}
  }
}
var Lambda_publisher = function () {}

Lambda_publisher.prototype.package = function (root, opts, cb) {
  var self = this
  if (opts && typeof opts === 'function') {
    cb = opts
    _.defaults({}, Private.default_options)
  } else {
    _.defaults(opts, Private.default_options)
  }
  this.opts = opts
  if (!cb) {
    cb = function () {}
  }
  try {
    this.root = Private.set_root(root)
  } catch (e) {
    cb(e)
    return null
  }
  if (this.opts.dest) {
    this.opts.dest = path.resolve(this.opts.dest)
  } else {
    this.opts.dest = this.root
  }
  var copy_options = { exclude: opts.exclude }
  if (opts.manifest_file) {
    copy_options.exclude.push(opts.manifest_file)
  }
  if (opts.config_file) {
    copy_options.exclude.push(opts.config_file)
  }
  copy_to_temp(this.root, copy_options, function (err, tmp_dir) {
    if (err) {
      cb(err)
      return null
    }
    if (!tmp_dir) {
      cb()
    }
    async.series([
      function (done) {
        parse_lambda_data(tmp_dir, self.opts, function (err, data) {
          if (err) {
            done(err)
            return null
          }
          self.opts.config = data[0]
          self.opts.manifest = data[1]
          done()
        })
      },
      function (done) {
        var package_json_stat
        try {
          package_json_stat = fs.lstatSync(path.join(tmp_dir, 'package.json'))
        } catch (e) {
          done()
          return null
        }
        if (package_json_stat.isFile()) {
          exec('npm install --production', { cwd: tmp_dir}, function (err) {
            done(err)
          })
        } else {
          done()
        }
      }
    ], function (err, data) {
      package_lambda({ source: this.root, dest: this.opts.dest, name: this.opts.manifest.name }, function (err, data) {
        if (err) {
          cb(err)
          return null
        }
        cb(null, data)
      })
    })
  })
}

Lambda_publisher.prototype.publish = function (root, opts, cb) {
  this.package(root, opts, function (err, done) {
    if (err) {
      cb(err)
      return null
    }
    done()
  })
}

module.exports = Lambda_publisher

if (require.main === module) {
  var publisher = new Lambda_publisher()
  var argv = require('yargs').argv
  var root_path = './'
  if (argv._.length) {
    root_path = argv._[0]
  }
  publisher.publish(root_path, argv, function (err, result) {
    if (err) {
      console.log(err.message)
      process.exit(1)
    }
    console.log(publisher.root + ' Done!')
  })
}
