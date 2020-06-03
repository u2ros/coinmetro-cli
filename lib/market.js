const c = require('ansi-colors')
const ac = require('asciichart')
const utils = require('./utils')
const constants = require('./constants')

module.exports.list = function (api) {
  return new Promise((resolve, reject) => {
    api.getLatestPrices()
    .then(latestPrices => {
      let maxLength = latestPrices.reduce((val, item) => { return item.pair.length > val ? item.pair.length : val }, 0)
      latestPrices.sort((a, b) => a.pair < b.pair ? -1 : 1)
      latestPrices.forEach(p => {
        console.log(`${c.bold(p.pair.padEnd(maxLength, ' '))}: ${c.yellow(p.price.toFixed(6).toString().padStart(11, ' '))}`)
      })
      resolve()
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.list.help = {
  descr: 'List available markets (trading pairs)',
  format: 'cm market list',
  examples: [
    'cm market list'
  ]
}

module.exports.book = function (api, pair, rows=10) {
  if (typeof pair === 'undefined') throw "Missing pair argument"
  pair = pair.toUpperCase()
  rows = parseInt(rows)
  return new Promise((resolve, reject) => {
    api.getFullBook(pair)
    .then(latestPrices => {
      const transform = (raw, reverse) => {
        const temp = Object.keys(raw)
        temp.sort((a, b) => {
          a = parseFloat(a)
          b = parseFloat(b)
          if (a === b) return 0
          return a < b ? 1 : -1
        })

        const rcount = temp.length > rows ? rows : temp.length
        const start = reverse ? temp.length - rcount : 0
        const end = reverse ? temp.length : rcount
        const prices = []

        for (let i=start; i<end; i++) {
          let price = parseFloat(temp[i])
          let volume = raw[temp[i]]
          prices.push({ price, volume })
        }
        const max = prices.reduce((val, it) => val > it.price * it.volume ? val : it.price * it.volume, 0)
        return [max, prices]
      }

      const [amax, asks] = transform(latestPrices.book.ask, true)
      const [bmax, bids] = transform(latestPrices.book.bid, false)

      const max = Math.max(amax, bmax)

      const print = (color, max) => {
        return (item) => {
          let n = Math.round(item.price * item.volume / max * 50)
          let price = color(c.bold(item.price.toFixed(4).padStart(11)))
          let v1 = item.volume.toFixed(3).padStart(12)
          let v2 = (item.volume * item.price).toFixed(3).padStart(12)
          let size = color('▮'.repeat(n))
          console.log(`${price} ${v1} ${v2} ${size}`)
        }
      }

      console.log(`${pair} Book (depth: ${rows})`)
      asks.forEach(print(c.red, max))
      bids.forEach(print(c.greenBright, max))

      resolve()
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.book.help = {
  descr: 'List market book',
  format: `cm market book ${c.bold.red('<pair>')} [${c.bold.cyan('<rows>')}]`,
  examples: [
    `cm market book ${c.bold.red('xcmeur')} ${c.bold.cyan('15')}`
  ]
}

module.exports.trades = function (api, pair, date, time='0:00') {
  if (typeof pair === 'undefined') throw "Missing pair argument"
  pair = pair.toUpperCase()
  date = typeof date !== 'undefined' ? Date.parse(`${date} ${time}`) : Date.now() - 86400000

  return new Promise((resolve, reject) => {
    api.getTrades(pair, date)
    .then(trades => {
      trades.tickHistory.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1)

      console.log(`Trades for ${c.bold.yellow(pair)} since ${utils.formatDate(date)}`)
      trades.tickHistory.forEach(t => {
        let q = t.qty.toFixed(3).padStart(12, ' ')
        let p = t.price.toFixed(4).padEnd(10, ' ')
        let d = utils.formatDate(t.timestamp)
        console.log(`${q} ${c.bold.yellowBright('@' + p)} ${c.dim(d)}`)
      })
      resolve()
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.trades.help = {
  descr: 'List market trades since specified date, default is from last 24 hours',
  format: `cm market trades ${c.bold.red('<pair>')} [${c.bold.cyan('<date>')} ${c.bold.yellowBright('<time h:mm:ss>')}]`,
  examples: [
    `cm market trades ${c.bold.red('<pair>')} ${c.bold.cyan('2020-05-20')} ${c.bold.yellowBright('7:00:00')}`
  ]
}

module.exports.chart = function (api, pair, chartconf) {
  if (typeof pair === 'undefined') throw "Missing pair argument"
  pair = pair.toUpperCase()
  return new Promise((resolve, reject) => {
    if (typeof chartconf === 'undefined') { chartconf = 'w' }
    api.getHistoricalPrices(pair, constants.chart[chartconf])
    .then(historicalPrices => {
      const tw = process.stdout.columns - 13
      const th = process.stdout.rows
      const ratio = historicalPrices.length / tw
      const padding = '          '
      const prices = []

      for (let i=0;i<tw;i++) {
        let j = Math.round(i * ratio)
        prices.push(historicalPrices[j].o)
      }

      console.log(`${constants.chart[chartconf].label} chart for ${c.bold.yellow(pair)}`)
      console.log(c.bold(ac.plot(prices, {
        height: th - 3,
        format (x) { return (padding + x.toFixed(4)).slice(-padding.length) }
      })))
      resolve()
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.chart.help = {
  descr: 'Displays a chart. If no timeframe is specified it will show a weekly chart',
  format: `cm market chart ${c.bold.red('<pair>')} [${c.bold.cyan('<timeframe d|w|m|y>')}]`,
  examples: [
    `cm market chart ${c.bold.red('xapieur')} ${c.bold.cyan('y')}`
  ]
}
