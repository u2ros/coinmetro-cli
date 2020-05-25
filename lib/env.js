const fs = require('fs')
const utils = require('./utils')

const envFile = 'env'

module.exports.val = function (prop) {
  const config = utils.readObj(envFile)
  return config.hasOwnProperty(prop) ? config[prop] : ''
}

module.exports.update = function (configObj) {
  const config = utils.readObj(envFile)
  Object.keys(configObj).forEach(key => {
    config[key] = configObj[key]
  })
  utils.writeObj(envFile, config)
}
