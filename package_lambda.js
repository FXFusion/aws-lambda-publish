var Adm_zip = require('adm-zip')
var path = require('path')
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
  var zip = new Adm_zip()
  var zip_name = path.join(config.dest, config.name + '.zip')
  try {
    zip.addLocalFolder(config.source, '/')
    zip.writeZip(zip_name)
    cb(null, zip_name)
  } catch (e) {
    cb(e)
  }
}
