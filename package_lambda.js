var path = require('path')
var exec = require('child_process').exec
var chdir = require('chdir')
module.exports = function (config, cb) {
  if (!config.source) {
    cb(new Error('Source folder not provided'))
    return null
  }
  config.source = path.resolve(config.source)
  if (!config.dest) {
    config.dest = config.source
  } else {
    config.dest = path.resolve(config.dest)
  }
  if (!config.name) {
    config.name = path.basename(config.source)
  }
  chdir(config.source, function () {
    var zip_name = path.join(config.dest, config.name + '.zip')
    exec('zip -r ' + zip_name + ' ./', function(err, result) {
      if (err) {
        cb(err)
        return null
      }
      cb(null, zip_name)
    })
  })
}
