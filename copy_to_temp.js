var tmp = require('tmp')
var fs = require('fs-extra')
var async = require('async')
var _ = require('lodash')
var path = require('path')
var Set = require('simplesets').Set
var Private = {
  copy_file: function (root, source, dest, cb) {
    var source_path = path.join(root, source)
    var dest_path = path.join(dest, source)
    if (!this.exclude.has(path.basename(source))) {
      fs.copy(source_path, dest_path, cb)
    } else {
      cb()
    }
  }
}
module.exports = function (source, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  if (opts.exclude) {
    opts.exclude = new Set(opts.exclude)
  } else {
    opts.exclude = new Set([])
  }
  fs.readdir(source, function (err, source_contents) {
    if (err) {
      cb(err)
      return null
    }
    if (source_contents.length === 0) {
      cb(null)
      return null
    }
    tmp.dir({unsafeCleanup: true}, function (err, dir_path, cleanupCallback) {
      if (err) {
        cb(err)
      }
      var copy_func = _.bind(Private.copy_file, opts, source, _, dir_path)
      async.each(source_contents, copy_func, function (err) {
        cb(err, dir_path)
      })
      cleanupCallback()
    })
  })
}
