const c = require('ansi-colors')
const env = require('./env')
const utils = require('./utils')
const cm = require('./api')(true)

module.exports.balance = function (api, amount, currency) {
  return new Promise((resolve, reject) => {
    if (typeof amount !== 'undefined' && typeof currency !== 'undefined') {
      currency = currency.toUpperCase()
      amount = parseFloat(amount)

      api.setMarginCollateral(amount, currency)
      .then(() => {
        module.exports.balance(api)
        resolve()
      })
      .catch(err => {
        reject(err)
      })
    } else {
      api.getMargin()
      .then(balances => {
        console.log('Available balance:')
        console.log('-'.repeat(70))
        Object.keys(balances.available).forEach(k => {
          let balance = balances.available[k].toFixed(2).padStart(11)
          console.log(`${balance}${k}`)
        })
        console.log('\nCollateral:')
        console.log('-'.repeat(70))
        Object.keys(balances.collateral).forEach(k => {
          let balance = balances.collateral[k].toFixed(2).padStart(11)
          console.log(`${balance}${k}`)
        })
        console.log('\nReserved (unmatched positions):')
        console.log('-'.repeat(70))
        Object.keys(balances.reserved).forEach(k => {
          let balance = balances.reserved[k].toFixed(2).padStart(11)
          console.log(`${balance}${k}`)
        })
        console.log('\nExposure (matched positions):')
        console.log('-'.repeat(70))
        Object.keys(balances.exposure).forEach(k => {
          let balance = balances.exposure[k].toFixed(2).padStart(11)
          console.log(`${balance}${k}`)
        })
        resolve()
      })
      .catch(err => {
        reject(err)
      })
    }
  })
}
module.exports.balance.help = {
  descr: 'View or update your margin collateral',
  format: `cm margin balance [${c.bold.red('<amount>')} ${c.bold.cyan('<currency>')}]`,
  examples: [
    `cm margin balance              // display balance and collateral`,
    `cm margin balance ${c.bold.red('1200')} ${c.bold.cyan('eur')}     // add 1200 EUR to collateral`,
    `cm margin balance ${c.bold.red('0')} ${c.bold.cyan('btc')}        // free any BTC locked as collateral`
  ]
}


module.exports.list = utils.list(constants.platform.margin)

module.exports.history = utils.history(constants.platform.margin)

module.exports.cancel = utils.cancel(constants.platform.margin)

module.exports.mcancel = utils.mcancel()

module.exports.buy = utils.trade(constants.platform.margin, constants.operation.buy)

module.exports.sell = utils.trade(constants.platform.margin, constants.operation.sell)

module.exports.mbuy = utils.mtrade(constants.platform.margin, constants.operation.buy)

module.exports.msell = utils.mtrade(constants.platform.margin, constants.operation.sell)
