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

module.exports.login = function (cm, login, password, otp=null) {
  return new Promise((resolve, reject) => {
    cm.login(login, password, otp)
    .then(res => {
      if (res.message === '2FA Required') throw 'Missing 2FA'
      env.update({ token: res.token, userId: res.userId })
      mode = env.val('demo') === 'true' ? 'demo' : 'live'
      console.log(c.greenBright(`Login successful, token updated (${mode} mode is activated)`))
      resolve()
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.login.help = {
  descr: 'Login using your credentials',
  format: `cm auth login ${c.bold.red('<username>')} ${c.bold.cyan('<password>')} [${c.bold.greenBright('<2fa code>')}]`,
  examples: [
    `cm auth login ${c.bold.red('whale@gmail.com')} ${c.bold.cyan('pumpndump')} ${c.bold.greenBright('254766')}`,
    `cm auth login ${c.bold.red('whale@gmail.com')} ${c.bold.cyan('pumpndump')} // no 2fa code neccessary if it's not enabled`,
  ]
}

const unauth = {
  'auth': {
    'demo': true,
    'live': true,
    'login': true
  },
  'market': {
    'chart': true,
    'book': true,
    'trades': true
  },
  'cmd': {
    'list': true,
    'store': true,
    'del': true,
    'run': true
  }
}

module.exports.check = function (command, subcommand) {
  this.help = {
    sig: '',
    descr: ''
  }

  return new Promise((resolve, reject) => {
    if (typeof unauth[command] !== 'undefined' && typeof unauth[command][subcommand] !== 'undefined') {
      resolve()
    } else if (env.val('token') !== '') {
      a.defaults.headers["Authorization"] = `Bearer ${env.val('token')}`
      resolve()
    } else {
      reject(c.red('No auth token found, use cm auth login <login> <password> [<2fa code>] command first'))
    }
  })
}
