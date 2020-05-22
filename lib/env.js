const fs = require('fs')
const utils = require('./utils')

const envPath = '.env'

module.exports.update = function (configObj) {
  const config = utils.readObj(envPath)
  Object.keys(configObj).forEach(key => {
    config[key] = configObj[key]
  })
  utils.writeObj(envPath, config)
}
