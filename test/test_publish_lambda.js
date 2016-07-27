var expect = require('expect')
var publish_lambda
var mockery = require('mockery')
var _ = require('lodash')
var fs = require('fs')
var tmp = require('tmp')
var path = require('path')
var mockAws = {
  lastLambdaClient: null,
  Lambda: function (config) {
    mockAws.lastLambdaClient = this
    this.functions = {}
  }
}
mockAws.Lambda.prototype.getFunction = function (config, callback) {
  var func = null
  if (!this.functions.hasOwnProperty(config.FunctionName)) {
    callback({statusCode: 404})
    return null
  }
  func = this.functions[config.FunctionName]
  if (config.Qualifier) {
    if (func.hasOwnProperty('aliases') && func.aliases.hasOwnProperty[config.Qualifier]) {
      var index = func.aliases[config.Qualifier]
      callback(null, func[index])
      null
    } else {
      callback({statusCode: 404})
      return null
    }
  } else {
    callback(null, func[func.length - 1])
  }
}

mockAws.Lambda.prototype.createFunction = function (config, callback) {
  if (this.functions.hasOwnProperty(config.FunctionName)) {
    callback({statusCode: 400})
    return null
  }
  this.functions[config.FunctionName] = [config]
  callback(null, {FunctionName: config.FunctionName, Version: '0'})
}

mockAws.Lambda.prototype.createAlias = function (config, callback) {
  var version = parseInt(config.FunctionVersion, 10)
  var func = this.functions[config.FunctionName]
  if (!func) {
    callback({statusCode: 404})
    return null
  }
  if (!func.aliases) {
    func.aliases = {}
  }
  var instance = func[version]
  if (!instance) {
    callback({statusCode: 404})
    return null
  }
  func.aliases[config.Name] = version
  callback(null, {Version: String(version)})
}

mockAws.Lambda.prototype.getAlias = function (config, callback) {
  var func = this.functions[config.FunctionName]
  if (!func) {
    callback({statusCode: 404})
    return null
  }
  if (!func.aliases) {
    callback({statusCode: 404})
    return null
  }
  if (!func.aliases[config.Name]) {
    callback({statusCode: 404})
    return null
  }
  callback(null, {FunctionVersion: String(func.aliases[config.Name])})
}

mockAws.Lambda.prototype.updateFunctionCode = function (config, callback) {
  var func = this.functions(config.FunctionName)
  if (!func) {
    callback({statusCode: 404})
    return null
  }
  var lastVersion = func[func.length - 1]
  var newVersion = _.defaults(lastVersion, config)
  func.push(newVersion)
  callback(null, {Version: String(func.length - 1)})
}

mockAws.Lambda.prototype.updateFunctionConfiguration = function (config, callback) {
  var func = this.functions(config.FunctionName)
  if (!func) {
    callback({statusCode: 404})
    return null
  }
  func.push(config)
  callback(null, {Version: String(func.length - 1)})
}

mockAws.Lambda.prototype.inspectFunctions = function () {
  return this.functions
}

var manifest = {}

describe('publish lambda function', function () {
  beforeEach(function () {
    manifest = {
      region: 'us-west-2',
      name: 'test-lambda',
      handler: 'index.handler',
      role: 'aws::arn::role',
      stage: 'dev'
    }
    this.tmp_dir = tmp.dirSync({ unsafeCleanup: true })
    this.zipFilePath = path.join(this.tmp_dir.name, 'zip')
    fs.writeFileSync(this.zipFilePath, 'zip')
    mockery.enable({ warnOnUnregistered: true })
    mockery.registerMock('aws-sdk', mockAws)
    publish_lambda = require('../publish_lambda')
  })
  afterEach(function () {
    mockery.disable()
    this.tmp_dir.removeCallback()
  })
  context('Brand new function', function () {
    it('should create the function and the alias', function (done) {
      publish_lambda(this.zipFilePath, manifest, function (err, data) {
        if (err) {
          done(err)
          return null
        }
        var functions = mockAws.lastLambdaClient.inspectFunctions()
        expect(data.Version).toEqual('0')
        expect(functions[manifest.name].aliases.dev).toEqual(parseInt(data.Version, 10))
        done()
      })
    })
  })
  context('Existing function', function () {
    it('should update the configuration', function (done) {
      var self = this
      // Publish once
      publish_lambda(self.zipFilePath, manifest, function (err, data) {
        if (err) {
          done(err)
          return null
        }
        manifest.timeout = 30
        publish_lambda(self.zipFilePath, manifest, function (err, data) {
          if (err) {
            done(err)
            return null
          }
          var functions = mockAws.lastLambdaClient.inspectFunctions()
          var lambda = functions['test-lambda'][functions['test-lambda'].length - 1]
          expect(lambda.Timeout).toEqual(30)
          done()
        })
      })
    })
  })
})
