const a = require('axios')
const c = require('ansi-colors')
const env = require('./env')

module.exports.demo = function () {
  return new Promise((resolve) => {
    env.update({ demo: true })
    console.log(c.bold('You are now in demo mode! Please login again to update token.'))
    resolve()
  })
}
module.exports.demo.help = {
  descr: 'Activate demo mode. Requires login afterwards',
  format: 'cm auth demo',
  examples: [
    'cm auth demo'
  ]
}

module.exports.live = function () {
  return new Promise((resolve) => {
    env.update({ demo: false })
    console.log(c.bold.yellow(`You are now in ${c.red('live')} mode! Please login again to update token.`))
    resolve()
  })
}
module.exports.live.help = {
  descr: 'Activate live mode. Requires login afterwards',
  format: 'cm auth live',
  examples: [
    'cm auth live'
  ]
}

module.exports.login = function (cm, login, password) {
  return new Promise((resolve, reject) => {
    cm.login(login, password)
    .then(res => {
      env.update({ token: res.token, userId: res.userId })
      mode = process.env.demo ? 'demo' : 'live'
      console.log(c.greenBright(`Login successfull, token updated (${mode} mode is activated)`))
      resolve()
    })
    .catch(err => {
      console.log(err)
      reject(err)
    })
  })
}
module.exports.login.help = {
  descr: 'Login using your credentials',
  format: `cm auth login ${c.bold.red('<username>')} ${c.bold.cyan('<password>')}`,
  examples: [
    `cm auth login ${c.bold.red('whale@gmail.com')} ${c.bold.cyan('pumpndump')}`,
  ]
}

module.exports.check = function (command, subcommand) {
  this.help = {
    sig: '',
    descr: ''
  }

  return new Promise((resolve, reject) => {
    if (command === 'auth' && subcommand === 'login') {
      resolve()
    } else if (process.env.token !== '') {
      a.defaults.headers["Authorization"] = `Bearer ${process.env.token}`
      resolve()
    } else {
      console.log(c.red('No auth token found, use login <login> <password> command first'))
      reject()
    }
  })
}
