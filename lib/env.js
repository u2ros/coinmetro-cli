const fs = require('fs')

const envPath = '.env'

function read () {
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, '')
  }

  const rows = fs.readFileSync(envPath).toString().split('\n')
  const config = {}
  rows.forEach(row => {
    let [prop, value] =  row.split('=')
    config[prop] = value
  })
  return config
}

function write(config) {
  const settings = []
  const props = Object.keys(config).map(key => {
    settings.push(`${key}=${config[key]}`)
  })
  const file = fs.writeFileSync(envPath, settings.join('\n'))
}

module.exports.update = function (configObj) {
  const config = read()
  Object.keys(configObj).forEach(key => {
    config[key] = configObj[key]
  })
  write(config)
}
