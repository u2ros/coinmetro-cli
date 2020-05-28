const fs = require('fs')
const path = require('path')
const home = require('os').homedir()
const c = require('ansi-colors')

function readObj (filename) {
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

function writeObj (filename, obj) {
  const filepath = path.join(home, '.coinmetro-cli', filename)
  const rows = []
  Object.keys(obj).map(key => {
    rows.push(`${key}=${obj[key]}`)
  })
  fs.writeFileSync(filepath, rows.join('\n'))
}

function formatDate (miliseconds, full=true) {
  const date = new Date(miliseconds)
  const Y = date.getFullYear().toString()
  const M = (date.getMonth() + 1).toString().padStart(2, '0')
  const D = (date.getDate()).toString().padStart(2, '0')
  const h = date.getHours().toString().padStart(2, '0')
  const m = (date.getMinutes()).toString().padStart(2, '0')
  const s = (date.getSeconds()).toString().padStart(2, '0')

  return full ? `${Y}-${M}-${D} ${h}:${m}:${s}` : `${Y}-${M}-${D}`
}

function parseDate (date, time='0:00:00') {
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

function printOrders (api, orders, pair, tram=false) {
  orders.forEach(o => {
    let bc = o.buyingCurrency
    let sc = o.sellingCurrency
    let bq = o.buyingQty
    let btq = o.boughtQty
    let sq = o.sellingQty
    let sdq = o.soldQty
    let m = o.margin ? 'M' : ' '
    let p1 = `${bc}${sc}`
    let p = pair === p1 ? sq / bq : bq / sq
    let filled = pair === p1 ? (100.00 * btq / bq).toFixed(2) : (100.00 * sdq / sq).toFixed(2)
    p = p.toFixed(3).padStart(9)
    bq = bq.toFixed(3)
    sq = sq.toFixed(3)
    let date = formatDate(o.creationTime)

    if ((!tram && typeof o.tramID !== 'undefined') || (tram && typeof o.tramID === 'undefined')) return // skip if needed

    if (pair === p1) {
      console.log(`${c.bold.green(m + 'B')} ${bq.padStart(10)}${bc.padEnd(3)} ${c.yellowBright('@' + p)} for ${sq.padStart(12)}${sc} ${filled}% ${api.tif[o.timeInForce]} ${c.dim(date)} ${c.dim(o.orderID)}`)
    } else {
      console.log(`${c.bold.red  (m + 'S')} ${sq.padStart(10)}${sc.padEnd(3)} ${c.yellowBright('@' + p)} for ${bq.padStart(12)}${bc} ${filled}% ${api.tif[o.timeInForce]} ${c.dim(date)} ${c.dim(o.orderID)}`)
    }
  })
}

function printHelp (context, subcommand) {
  console.log(context[subcommand].help.descr)
  console.log('\nSyntax:')
  console.log(context[subcommand].help.format)
  console.log('\nExample:')
  context[subcommand].help.examples.forEach(snippet => {
    console.log(snippet)
  })
  console.log('\n')
}

function findPair (pairs, c1, c2) {
  return pairs.find(pair => {
    return pair.indexOf(c1) >= 0 && pair.indexOf(c2) >= 0
  })
}

function generateTradeFunction (platform, operation) {
  return function (api, q1, c1, p, c2, tif=api.timeInForce.gtc, d=5) {
    return new Promise((resolve, reject) => {
      q1 = parseFloat(q1)
      c1 = c1.toUpperCase()
      p = parseFloat(p.replace('@', ''))
      c2 = c2.toUpperCase()
      tif = tif.toUpperCase()
      d = parseFloat(d)

      const pair = findPair(api[`${platform}Pairs`], c1, c2)
      const q2 = pair.indexOf(c1) === 0 ? q1 * p : q1 / p

      const req = {
        orderPlatform: platform,
        orderType: 'limit', // stop orders not supported atm
        fillStyle: operation,
        buyingCurrency: c1,
        sellingCurrency: c2,
        buyingQty: q1,
        sellingQty: q2,
        timeInForce: tif
      }
      console.log(req)
      if (tif === api.timeInForce.gtd.toUpperCase()) { req.expirationTime = Date.now() + d * 1000 }

      api.sendOrder(req)
      .then(order => {
        console.log(c.greenBright('Success!'))
        printOrders(api, [order], pair)
        resolve()
      })
      .catch(err => {
        reject(err)
      })
    })
  }
}

function createBuy (platform) {
  return function (api, bq, bc, p, sc, tif=api.timeInForce.gtc, d=5) {
    return new Promise((resolve, reject) => {
      bq = parseFloat(bq)
      bc = bc.toUpperCase()
      p = parseFloat(p.replace('@', ''))
      sc = sc.toUpperCase()
      tif = tif.toUpperCase()
      d = parseFloat(d)

      const sq = bq * p
      const req = {
        orderPlatform: 'trade', // margin not supported atm
        orderType: 'limit',     // limit orders only
        fillStyle: 'buy',
        buyingCurrency: bc,
        sellingCurrency: sc,
        buyingQty: bq,
        sellingQty: sq,
        timeInForce: tif
      }
      if (tif === api.timeInForce.gtd.toUpperCase()) { req.expirationTime = Date.now() + d * 1000 }

      api.sendOrder(req)
      .then(order => {
        console.log(c.greenBright('Success!'))
        pair = `${order.buyingCurrency}${order.sellingCurrency}`
        utils.printOrders(api, [order], pair)
        resolve()
      })
      .catch(err => {
        reject(err)
      })
    })
  }
}

function createSell (platform) {
  return function (api, sq, sc, p, bc, tif=api.timeInForce.gtc, d=5) {
    return new Promise((resolve, reject) => {
      sq = parseFloat(sq)
      sc = sc.toUpperCase()
      p = parseFloat(p.replace('@', ''))
      bc = bc.toUpperCase()
      tif = tif.toUpperCase()
      d = parseFloat(d)

      const bq = sq * p
      const req = {
        orderPlatform: platform, // margin not supported atm
        orderType: 'limit',      // limit orders only
        fillStyle: 'sell',
        buyingCurrency: bc,
        sellingCurrency: sc,
        buyingQty: bq,
        sellingQty: sq,
        timeInForce: tif
      }
      if (tif === api.timeInForce.gtd.toUpperCase()) { req.expirationTime = Date.now() + d * 1000 }

      api.sendOrder(req)
      .then(order => {
        console.log(c.greenBright('Success!'))
        pair = `${order.buyingCurrency}${order.sellingCurrency}`
        utils.printOrders(api, [order], pair)
        resolve()
      })
      .catch(err => {
        reject(err)
      })
    })
  }
}


module.exports.readObj = readObj
module.exports.writeObj = writeObj
module.exports.formatDate = formatDate
module.exports.parseDate = parseDate
module.exports.generateTradeFunction = generateTradeFunction
module.exports.printOrders = printOrders
module.exports.printHelp = printHelp
module.exports.createSell = createSell
module.exports.createBuy = createBuy
