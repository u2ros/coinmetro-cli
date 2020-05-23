const c = require('ansi-colors')

module.exports.list = function (api) {
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
module.exports.list.help = {
  descr: 'List your available balances',
  format: 'cm balance list',
  examples: [
    'cm balance list'
  ]
}
