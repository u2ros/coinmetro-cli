const child = require('child_process')
const c = require('ansi-colors')
const utils = require('./utils')

const cmdFile = 'cmd'

module.exports.list = function (api) {
  return new Promise((resolve) => {
    let cmds = utils.readObj(cmdFile)
    let names = Object.keys(cmds).filter(a => a !== '' ? true : false)
    console.log(`There are currently ${names.length} stored commands`)

    names.forEach(name => {
      let cmd = cmds[name]
      name = name.padStart(15, ' ')
      console.log(`${name}: ${cmd}`)
    })
    resolve()
  })
}
module.exports.list.help = {
  descr: 'list stored commands',
  format: 'cm cmd list',
  examples: [
    'cm cmd list'
  ]
}

module.exports.store = function (api, cmd, name) {
  return new Promise((resolve, reject) => {
    let cmds = utils.readObj(cmdFile)
    let names = Object.keys(cmds)

    if (names.indexOf(name) >= 0) throw `Skipping, command named ${c.bold.red(name)} already exists`
    cmds[name] = cmd

    utils.writeObj(cmdFile, cmds)
    console.log(`Command stored successfully, to use it, type ${c.bold.greenBright('cm cmd run ' + name)}`)
  })
}
module.exports.store.help = {
  descr: 'store a command (please use quotes to wrap command',
  format: `cm cmd store ${c.bold.red('"<command>"')} ${c.bold.cyan('<name>')}`,
  examples: [
    `cm cmd store ${c.bold.red('"cm market book btceur"')} ${c.bold.cyan('mycmd1')}`,
    `cm cmd store ${c.bold.red('"cm market chart btceur && cm market chart xcmeur"')} ${c.bold.cyan('mycmd2')}`
  ]
}

module.exports.del = function (api, name) {
  return new Promise((resolve, reject) => {
    let cmds = utils.readObj(cmdFile)
    if (!cmds.hasOwnProperty(name)) {
      reject(`There is no command named ${c.bold.red(name)} stored`)
      return
    }
    delete cmds[name]
    utils.writeObj(cmdFile, cmds)
    console.log(`Deleted command ${c.bold.greenBright(name)}`)
    resolve()
  })
}
module.exports.del.help = {
  descr: 'delete a previously stored command',
  format: `cm cmd del ${c.bold.red('<name>')}`,
  examples: [
    `cm cmd del ${c.bold.red('mycmd1')}`
  ]
}

module.exports.run = function (api, name) {
  return new Promise((resolve, reject) => {
    let cmds = utils.readObj(cmdFile)
    if (!cmds.hasOwnProperty(name)) throw `No command named ${c.bold.red(name)} exists. Type cm cmd list to display available commands`

    cmds = cmds[name].split('&&')
    cmds.forEach(cmd => {
      let args = cmd.trim().split(' ')
      let exe = args.shift()

      child.spawnSync(exe, args, { shell: true, stdio: 'inherit' })
    })

    resolve()
  })
}
module.exports.run.help = {
  descr: 'run your stored command',
  format: `cm cmd run ${c.bold.red('<name>')}`,
  examples: [
    `cm cmd del ${c.bold.red('mycmd1')}`
  ]
}
