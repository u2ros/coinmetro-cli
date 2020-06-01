const c = require('ansi-colors')
const env = require('./env')
const utils = require('./utils')
const cm = require('./api')(true)

module.exports.balance = function (api) {
  return new Promise((resolve, reject) => {
    const tasks = []
    tasks.push(api.getBalances())
    tasks.push(api.getWallets())

    Promise.all(tasks)
    .then(results => {
      const balances = results[0]
      const wallets = results[1].list

      console.log('      Total        Available')
      console.log('-'.repeat(70))
      Object.keys(balances).forEach(b => {
        if (b === 'TOTAL' || b === 'REF') return

        let total = balances[b][b]
        //find how much is reserved
        let w = wallets.find(x => x.currency === b)
        let cur = total.toFixed(2).padStart(10, ' ')
        let ava = typeof w !== 'undefined' ? (total - w.reserved) : 0.0 // demo api is different, this is why this is needed
        ava = ava.toFixed(2).padStart(10, ' ')
        let usd = balances[b]['USD'] ? balances[b]['USD'] : 0.0 // demo api has no USD field
        usd = usd.toFixed(2).padStart(10, ' ')
        let eur = balances[b]['EUR'].toFixed(2).padStart(10, ' ')
        let btc = balances[b]['BTC'].toFixed(6).padStart(10, ' ')
        console.log(`${cur}${b} ${ava}${b} ${c.greenBright(usd + 'USD')} ${c.blueBright(eur + 'EUR')} ${c.yellowBright(btc +'BTC')}`)
      })
      usd = balances.TOTAL.USD ? balances.TOTAL.USD : 0.0 // demo api has no USD field
      usd = usd.toFixed(2).padStart(10, ' ')
      eur = balances.TOTAL.EUR.toFixed(2).padStart(10, ' ')
      btc = balances.TOTAL.BTC.toFixed(6).padStart(10, ' ')
      console.log('-'.repeat(70))
      console.log(' '.repeat(28) + `${c.bold.greenBright(usd + 'USD')} ${c.bold.blueBright(eur + 'EUR')} ${c.bold.yellowBright(btc +'BTC')}`)
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.balance.help = {
  descr: 'List your available balances',
  format: 'cm balance list',
  examples: [
    'cm balance list'
  ]
}

module.exports.list = utils.generateListFunction(cm.platform.trade)
module.exports.list.help = {
  descr: 'List open orders',
  format: `cm trade list [${c.bold.red('pair')}]`,
  examples: [
    `cm trade list ${c.bold.red('xcmeur')}`
  ]
}

module.exports.history = utils.generateHistoryFunction(cm.platform.trade)
module.exports.history.help = {
  descr: 'List closed orders on trade platform',
  format: `cm trade history [${c.bold.red('<pair')} ${c.bold.cyan('<kind filled|all>')} ${c.bold.greenBright('<since YYYY-MM-DD>')}]`,
  examples: [
    `cm trade history ${c.bold.red('btceur')} ${c.bold.cyan('filled')} ${c.bold.greenBright('2020-04-05')}`
  ]
}

module.exports.cancel = utils.generateCancelFunction(cm.platform.trade)
module.exports.cancel.help = {
  descr: 'Cancel a specific order using its id',
  format: `cm trade cancel ${c.bold.red('<order id>')}`,
  examples: [
    `cm trade cancel ${c.bold.red('5a902cb722a7b962b93234dsfd9b15895286891136ed60b54270a136b')}`
  ]
}

module.exports.mcancel = utils.generateMCancelFunction()
module.exports.mcancel.help = {
  descr: 'Cancel multiple orders mathing the criteria',
  format: `cm limit mcancel ${c.bold.red('<pair>')} ${c.bold.cyan('<mode byprice|bydate>')} ${c.bold.green('@<start price>-<end price>|<start date YYYY-MM-DD> <start time hh:mm> <end date YYYY-MM-DD> <end time hh:mm>')}`,
  examples: [
    `cm limit mcancel ${c.bold.red('xcmeur')} ${c.bold.cyan('byprice')} ${c.bold.green('@0.03-0.04')}`,
    `cm limit mcancel ${c.bold.red('xcmeur')} ${c.bold.cyan('bydate')} ${c.bold.green('2020-01-07 7:00 2020-01-09 12:00')}`
  ]
}

module.exports.buy = utils.generateTradeFunction(cm.platform.trade, cm.operation.buy)
module.exports.buy.help = {
  descr: 'Send a buy orders',
  format: `cm limit buy ${c.bold.red('<buy quantity> <buy currency>')} ${c.bold.cyan('@<price>')} ${c.bold.green('<sell currency>')} [${c.bold.yellow('<time in force: gtc|ioc|gtd|fok>')} ${c.bold.white('<duration (s)>')}]`,
  examples: [
    `cm limit buy ${c.bold.red('10000 xcm')} ${c.bold.cyan('@0.75')} ${c.bold.green('eur')} ${c.bold.yellow('gtd')} ${c.bold.white('10')}`,
  ]
}

module.exports.sell = utils.generateTradeFunction(cm.platform.trade, cm.operation.sell)
module.exports.sell.help = {
  descr: 'Send a sell orders',
  format: `cm limit sell ${c.bold.red('<sell quantity> <sell currency>')} ${c.bold.cyan('@<price>')} ${c.bold.green('<buy currency>')} [${c.bold.yellow('<time in force: gtc|ioc|gtd|fok>')} ${c.bold.white('<duration (s)>')}]`,
  examples: [
    `cm limit sell ${c.bold.red('10000 xcm')} ${c.bold.cyan('@0.75')} ${c.bold.green('eur')} ${c.bold.yellow('gtd')} ${c.bold.white('10')}`,
  ]
}

module.exports.mbuy = utils.generateMTradeFunction(cm.platform.trade, cm.operation.buy)
module.exports.mbuy.help = {
  descr: 'Perform iceberg buy dividing a single order into a number of chunks (separate orders) within a specified price range',
  format: `cm limit mbuy ${c.bold.red('<buy quantity> <buy currency>')} ${c.bold.cyan('@<start price>-<end price>')} ${c.bold.green('<sell currency>')} ${c.bold.magenta('<order count>')} [${c.bold.yellow('<time in force: gtc|ioc|gtd|fok>')} ${c.bold.white('<duration (s)>')}]`,
  examples: [
    `cm limit mbuy ${c.bold.red('10000 xcm')} ${c.bold.cyan('@0.01-0.02')} ${c.bold.green('eur')} ${c.bold.magenta('10')} ${c.bold.yellow('gtc')} ${c.bold.white('10')}`,
  ]
}

module.exports.msell = utils.generateMTradeFunction(cm.platform.trade, cm.operation.sell)
module.exports.msell.help = {
  descr: 'Perform iceberg sell by dividing a single order into a number of chunks (separate orders) within a specified price range',
  format: `cm limit msell ${c.bold.red('<sell quantity> <sell currency>')} ${c.bold.cyan('@<start price>-<end price>')} ${c.bold.green('<buy currency>')} ${c.bold.magenta('<order count>')} [${c.bold.yellow('<time in force: gtc|ioc|gtd|fok>')} ${c.bold.white('<duration (s)>')}]`,
  examples: [
    `cm limit msell ${c.bold.red('10000 xcm')} ${c.bold.cyan('@0.5-0.6')} ${c.bold.green('EUR')} ${c.bold.magenta('10')} ${c.bold.yellow('gtc')} ${c.bold.white('10')}`,
  ]
}