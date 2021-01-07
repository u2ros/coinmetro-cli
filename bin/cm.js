#!/usr/bin/env node

const c = require('ansi-colors')
const auth = require('../lib/auth')
const utils = require('../lib/utils')
const env = require('../lib/env')

const argv = require('yargs').argv

if (argv._.length == 0) {
  console.log(c.red('Missing command argument'))
  process.exit(1)
}
const command = argv._[0]
let subcommand = argv._[1]
if (typeof subcommand === 'undefined') subcommand = 'default'

auth.check(command, subcommand)
.then(() => {
  const api = require('../lib/api')(env.val('demo') === 'true')
  let context
  try { context = require(`../lib/${command}.js`) }
  catch (err) {
    console.log(err)
    throw `Invalid base command '${command}'`
  }

  if (!context[subcommand]) throw `Invalid '${command}' subcommand: '${subcommand || ''}'`

  if (argv._[2] === '?') {
    utils.printHelp(context, subcommand)
    return
  }

  context[subcommand](api, ...argv._.slice(2))
  .then(() => {
    //we're done!
  })
  .catch(err => {
    if (err.response) { // semantic server error
      console.log(c.red(`Error: ${err.response.data.message} (status: ${err.response.status})`))
    } else { // user input error (probably)
      console.log(err)
    }
  })
})
.catch((err) => {
  console.log(err)
})
