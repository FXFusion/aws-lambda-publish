var aws = require('aws-sdk')
var fs = require('fs')
var Private = {
  validate_manifest: function (manifest) {
    if (!manifest.region) {
      throw new Error('manifest does not provide region')
    }
    if (!manifest.name) {
      throw new Error('manifest does not provide name')
    }
    if (!manifest.handler) {
      throw new Error('manifest does not provide handler')
    }
    if (!manifest.role) {
      throw new Error('manifest does not provide role')
    }
  },
  lambda_exists: function (lambda_client, lambda_name, cb) {
    lambda_client.getFunction({FunctionName: lambda_name }, function (err, data) {
      if (err) {
        if (err.statusCode === 404) {
          cb(null, false)
          return null
        } else {
          cb(err)
          return null
        }
      }
      cb(null, true)
    })
  },
  create_lambda: function (lambda_client, zipfile, manifest, cb) {
    console.log('Creating function ' + manifest.name)
    var create_params = {
      Code: {},
      FunctionName: manifest.name,
      Handler: manifest.handler,
      Role: manifest.role,
      Runtime: 'nodejs',
      Publish: true
    }
    if (manifest.description) {
      create_params.Description = manifest.description
    }
    if (manifest.memory_size) {
      create_params.MemorySize = manifest.memory_size
    }
    if (manifest.timeout) {
      create_params.Timeout = manifest.timeout
    }
    fs.readFile(zipfile, function (err, zip_file) {
      if (err) {
        cb(err)
        return null
      }
      create_params.Code.ZipFile = zip_file
      lambda_client.createFunction(create_params, function (err, data) {
        if (err) {
          cb(err)
          return null
        }
        if (manifest.stage) {
          Private.create_stage(lambda_client, manifest, data.Version, cb)
        } else {
          cb(null, data)
        }
      })
    })
  },
  update_lambda: function (lambda_client, zipfile, manifest, cb) {
    console.log('Updating function ' + manifest.name)
    var update_params = {
      FunctionName: manifest.name,
      Publish: true
    }
    fs.readFile(zipfile, function (err, zip_file) {
      if (err) {
        cb(err)
        return null
      }
      update_params.ZipFile = zip_file
      lambda_client.updateFunctionCode(update_params, function (err, data) {
        if (manifest.stage) {
          Private.create_stage(lambda_client, manifest, data.Version, cb)
        } else {
          cb(null, data)
        }
      })
    })
  },
  create_stage: function (lambda_client, manifest, version, cb) {
    console.log('Creating stage ' + manifest.stage + ' for version ' + version)
    lambda_client.getAlias({ FunctionName: manifest.name, Name: manifest.stage }, function (err, data) {
      if (err) {
        lambda_client.createAlias({
          FunctionName: manifest.name,
          FunctionVersion: version,
          Name: manifest.stage,
          Description: manifest.description
        }, cb)
      } else {
        lambda_client.updateAlias({
          FunctionName: manifest.name,
          FunctionVersion: version,
          Name: manifest.stage,
          Description: manifest.description
        }, cb)
      }
    })
  }
}
module.exports = function (zip_file, manifest, cb) {
  var lambda_client
  try {
    Private.validate_manifest(manifest)
  } catch (e) {
    cb(e)
    return null
  }
  lambda_client = new aws.Lambda({ region: manifest.region })
  Private.lambda_exists(lambda_client, manifest.name, function(err, exists) {
    if (err) {
      cb(err)
      return null
    }
    if (exists) {
      Private.update_lambda(lambda_client, zip_file, manifest, cb)
    } else {
      Private.create_lambda(lambda_client, zip_file, manifest, cb)
    }
  })
}
