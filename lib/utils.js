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

function printOrders (api, orders, platform, tram=false) {
  orders.forEach(o => {
    let bc = o.buyingCurrency
    let sc = o.sellingCurrency
    const pair = findPair(api[`${platform}Pairs`], bc, sc)
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

const filter = {
  byprice(o, from, to) {
    return o.price <  from || o.price > to
  },
  bydate(o, from, to) {
    return o.creationTime < from || o.creationTime > to
  }
}

function generateListFunction (platform) {
  return function (api, pair='') {
    pair = pair.toUpperCase()
    return new Promise((resolve, reject) => {
      api.getOpenOrders()
      .then(orders => {
        console.log(`Listing ${c.bold.yellowBright(pair)} ${platform} platform orders`)

        // TODO filter based on platform
        if (pair !== '') {
          orders = orders.filter(o => {
            let p1 = `${o.buyingCurrency}${o.sellingCurrency}`
            let p2 = `${o.sellingCurrency}${o.buyingCurrency}`
            return (pair === p1 || pair === p2) ? true : false
          })
        }

        orders.sort((a, b) => {
          if (Math.round(a.creationTime / 1000) === Math.round(b.creationTime / 1000)) {
            return a.buyingQty/a.sellingQty >= b.buyingQty / b.sellingQty ? 1 : -1
          }
          return a.creationTime > b.creationTime ? 1 : -1
        })

        if (!orders.length) {
          console.log('No orders found')
          resolve()
          return
        }
        printOrders(api, orders, platform)

        resolve()
      })
      .catch(err => {
        reject(err)
      })
    })
  }
}

function generateHistoryFunction (platform) {
  return function (api, pair='', kind = api.history.filled, since=null) {
    return new Promise((reject, resolve) => {
      pair = pair.toUpperCase()
      since = since ? Date.parse(since) : new Date(Date.now() - 86400000) // by default display orders in last 24 hours
      api.getOrderHistory(since)
      .then(history => {
        history.sort((a, b) => {
          return a.completionTime < b.completionTime ? -1 : 1
        })
        const toShow = []
        history.forEach(h => {
          let bc = h.buyingCurrency
          let btq = h.boughtQty
          let sc = h.sellingCurrency
          let sdq = h.soldQty
          let p = sdq / btq
          let d = utils.formatDate(h.completionTime)
          let id = h.orderID

          let p1 = `${bc}${sc}`
          let p2 = `${sc}${bc}`

          // TODO filter for platform
          if (pair !== '' && pair !== p1 && pair !== p2) return
          if (kind === api.history.filled && btq === 0) return
          if (since > new Date(h.creationTime)) return

          toShow.push(h)
        })

        utils.printOrders(api, toShow, pair)
      })
      .catch(err => {
        reject(err)
      })
    })
  }
}

function generateCancelFunction () {
  return function (api, id) {
    return new Promise((resolve, reject) => {
      //if id exists, cancel the order with that specific id
      api.cancelOrder(id)
      .then(() => {
        console.log(`${c.bold.greenBright('Successfully')} canceled order ${id}`)
        resolve()
      })
      .catch(err => {
        reject(err)
      })
    })
  }
}

function generateMCancelFunction (platform) {
  return function (api, pair='', mode=api.cancelMode.byprice, ...args) {
    pair = pair.toUpperCase()
    if (mode === api.cancelMode.byprice) {
      let [min, max] = args[0] ? args[0].replace('@', '').split('-') : [0, 1e15]
      from = parseFloat(min)
      to = parseFloat(max)
    } else {
      from = from ? Date.parse(args[0]) : 0
      to = to ? Date.parse(args[1]) : new Date().getTime()
    }

    return new Promise((resolve, reject) => {
      api.getOpenOrders()
      .then(orders => {
        const toCancel = []
        orders.forEach(o => {
          let p1 = `${o.buyingCurrency}${o.sellingCurrency}`
          let p2 = `${o.sellingCurrency}${o.buyingCurrency}`
          o.price = p1 === pair ? o.sellingQty / o.buyingQty : o.buyingQty / o.sellingQty
          let del= true
          // TODO if (o.platform !== platform) { del = false }
          if (pair !== '' && p1 !== pair && p2 !== pair) { del = false }
          if (filter[mode](o, from, to)) { del = false }
          if (typeof o.tramID !== 'undefined') { del = false }

          if (del) { toCancel.push(api.cancelOrder(o.orderID)) }
        })

        Promise.all(toCancel)
        .then(() => {
          console.log(`Canceled ${toCancel.length} orders`)
          resolve()
        })
        .catch(err => {
          reject(err)
        })
      })
      .catch(err => {
        reject(err)
      })
    })
  }
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

      let q2 = q1 * p
      if (pair.indexOf(c1) !== 0) {
        // this is an inverse operation
        q2 = q1 / p
        c1 = [c2, c2 = c1][0]
        q1 = [q2, q2 = q1][0]
        operation = operation === api.operation.buy ? api.operation.sell : api.operation.buy
      }

      const req = {
        orderPlatform: platform,
        orderType: 'limit',
        fillStyle: operation,
        buyingCurrency: operation === api.operation.buy ? c1 : c2,
        sellingCurrency: operation === api.operation.sell ? c1 : c2,
        buyingQty: operation === api.operation.buy ? q1 : q2,
        sellingQty: operation === api.operation.sell ? q1 : q2,
        timeInForce: tif
      }
      if (platform === api.platform.margin) { req.margin = true }
      if (tif === api.timeInForce.gtd.toUpperCase()) { req.expirationTime = Date.now() + d * 1000 }
      api.sendOrder(req)
      .then(order => {
        console.log(c.greenBright('Success!'))
        printOrders(api, [order], platform)
        resolve()
      })
      .catch(err => {
        reject(err)
      })
    })
  }
}

function generateMTradeFunction (platform, operation) {
  return function (api, q1, c1, p, c2, n, tif=api.timeInForce.gtc, d=5) {
    return new Promise((resolve, reject) => {
      q1 = parseFloat(q1)
      c1 = c1.toUpperCase()
      let [p1, p2] = p.replace('@', '').split('-')
      p1 = parseFloat(p1)
      p2 = parseFloat(p2)
      if (p2 < p1) throw 'Invalid price range, use @<min>-<max> format'
      c2 = c2.toUpperCase()
      n = parseInt(n)
      tif = tif.toUpperCase()
      d = parseFloat(d)
      const pair = findPair(api[`${platform}Pairs`], c1, c2)

      let inverse = false
      if (pair.indexOf(c1) !== 0) {
        // this is an inverse operation
        inverse = true
        c1 = [c2, c2 = c1][0]
        operation = operation === api.operation.buy ? api.operation.sell : api.operation.buy
      }

      const incr = (p2 - p1) / (n - 1)
      const orders = []
      for (let i=0; i<n; i++) {
        let pn = p1 + i * incr
        let nq1 = q1 / n
        let nq2 = inverse ? nq1 / pn : nq1 * pn
        if (inverse) {
          nq1 = [nq2, nq2 = nq1][0]
        }

        let req = {
          orderPlatform: platform,
          orderType: 'limit',
          fillStyle: operation,
          buyingCurrency: operation === api.operation.buy ? c1 : c2,
          sellingCurrency: operation === api.operation.sell ? c1 : c2,
          buyingQty: operation === api.operation.buy ? nq1 : nq2,
          sellingQty: operation === api.operation.sell ? nq1 : nq2,
          timeInForce: tif
        }
        if (platform === api.platform.margin) { req.margin = true }
        if (tif === api.timeInForce.gtd.toUpperCase()) { req.expirationTime = Date.now() + d * 1000 }

        orders.push(api.sendOrder(req))
      }

      Promise.all(orders)
      .then(orders => {
        console.log(c.greenBright('Success! The following orders were created:'))
        printOrders(api, orders, platform)
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
module.exports.generateListFunction = generateListFunction
module.exports.generateHistoryFunction = generateHistoryFunction
module.exports.generateTradeFunction = generateTradeFunction
module.exports.generateMTradeFunction = generateMTradeFunction
module.exports.generateCancelFunction = generateCancelFunction
module.exports.generateMCancelFunction = generateMCancelFunction
module.exports.printOrders = printOrders
module.exports.printHelp = printHelp
