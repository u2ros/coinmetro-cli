const fs = require('fs')
const path = require('path')
const home = require('os').homedir()

module.exports.readObj = function (filename) {
  const dirpath = path.join(home, '.coinmetro-cli')
  const filepath = path.join(dirpath, filename)
  
  if (!fs.existsSync(dirpath)) { fs.mkdirSync(dirpath) }
  if (!fs.existsSync(filepath)) { fs.writeFileSync(filepath, '') }  
  
  const rows = fs.readFileSync(filepath).toString().split('\n')
  const obj = {}
  rows.forEach(row => {
    let [prop, value] =  row.split('=')
    if (prop) {
      obj[prop] = value
    }
  })
  return obj
}

module.exports.writeObj = function (filename, obj) {
  const filepath = path.join(home, '.coinmetro-cli', filename)
  const rows = []
  Object.keys(obj).map(key => {
    rows.push(`${key}=${obj[key]}`)
  })
  fs.writeFileSync(filepath, rows.join('\n'))
}

module.exports.formatDate = function (miliseconds, full=true) {
  const date = new Date(miliseconds)
  const Y = date.getFullYear().toString()
  const M = (date.getMonth() + 1).toString().padStart(2, '0')
  const D = (date.getDate()).toString().padStart(2, '0')
  const h = date.getHours().toString().padStart(2, '0')
  const m = (date.getMinutes()).toString().padStart(2, '0')
  const s = (date.getSeconds()).toString().padStart(2, '0')

  return full ? `${Y}-${M}-${D} ${h}:${m}:${s}` : `${Y}-${M}-${D}`
}

module.exports.parseDate = function (date, time='0:00:00') {
  const { Y, M, D } = date.split('-')
  const { h, m, s } = time.split(':')

  Y = parseInt(Y)
  M = parseInt(M) - 1
  D = parseInt(D) - 1

  h = parseInt(h)
  m = parseInt(m)
  s = parseInt(s)

  return new Date(Y, M, D, h, m, s, 0)
}

module.exports.printHelp = function (context, subcommand) {
  console.log(context[subcommand].help.descr)
  console.log('\nSyntax:')
  console.log(context[subcommand].help.format)
  console.log('\nExample:')
  context[subcommand].help.examples.forEach(snippet => {
    console.log(snippet)
  })
  console.log('\n')
}
