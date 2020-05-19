const utils = require('./utils')

module.exports.list = function (cm) {
  return new Promise((resolve, reject) => {
    cm.getBalances()
    .then(balances => {
      Object.keys(balances).forEach(b => {
        if (b === 'TOTAL' || b === 'REF') return
        let cur = balances[b][b].toFixed(2).padStart(10, ' ')
        let eur = balances[b]['EUR'].toFixed(2).padStart(10, ' ')
        let btc = balances[b]['BTC'].toFixed(6).padStart(10, ' ')
        console.log(`${cur}${b} ${eur}EUR ${btc}BTC`)
      })
      eur = balances.TOTAL.EUR.toFixed(2).padStart(10, ' ')
      btc = balances.TOTAL.BTC.toFixed(6).padStart(10, ' ')
      console.log('-----------------------------------------')
      console.log(`Total:        ${eur}EUR ${btc}BTC`)
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.list.help = {
  descr: 'List your available balances',
  format: 'cm balance list',
  examples: [
    'cm balance list'
  ]
}
