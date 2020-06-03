const fs = require('fs')
const path = require('path')
const home = require('os').homedir()
const c = require('ansi-colors')
const constants = require('./constants')

function readObj (filename) {
  const dirpath = path.join(home, '.coinmetro-cli')
  const filepath = path.join(dirpath, filename)

  if (!fs.existsSync(dirpath)) { fs.mkdirSync(dirpath) }
  if (!fs.existsSync(filepath)) { fs.writeFileSync(filepath, '') }

  const rows = fs.readFileSync(filepath).toString().split('\n')
  const obj = { }
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

function printOrders (api, orders) {
  orders.forEach(o => {
    const bc = o.buyingCurrency
    const sc = o.sellingCurrency
    const pair = findPair(bc, sc)
    let bq = o.buyingQty
    const btq = o.boughtQty
    let sq = o.sellingQty
    const sdq = o.soldQty
    const p1 = `${bc}${sc}`

    let p
    let f
    if (typeof bq === 'undefined' && typeof sq === 'undefined') { // filled orders
      f = pair === p1 ? (100.00 * btq / bq).toFixed(2) : (100.00 * sdq / sq).toFixed(2)
      p = pair === p1 ? sdq / btq : btq / sdq
      bq = btq.toFixed(3)
      sq = sdq.toFixed(3)
    } else { // unfilled
      f = 0
      p = pair === p1 ? sq / bq : bq / sq
      bq = bq.toFixed(3)
      sq = sq.toFixed(3)
    }
    p = p.toFixed(5).padStart(11)
    const date = formatDate(o.creationTime)

    if (pair === p1) {
      console.log(`${c.bold.green('B')} ${bq.padStart(10)}${bc.padEnd(3)} ${c.yellowBright('@' + p)} for ${sq.padStart(12)}${sc} ${f}% ${constants.tif[o.timeInForce]} ${c.dim(date)} ${c.dim(o.orderID)}`)
    } else {
      console.log(`${c.bold.red  ('S')} ${sq.padStart(10)}${sc.padEnd(3)} ${c.yellowBright('@' + p)} for ${bq.padStart(12)}${bc} ${f}% ${constants.tif[o.timeInForce]} ${c.dim(date)} ${c.dim(o.orderID)}`)
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

function findPair (c1, c2) {
  return constants.pairs.find(pair => {
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

function open (platform) {
  function func (api, pair='') {
    pair = pair.toUpperCase()
    return new Promise((resolve, reject) => {
      api.getOpenOrders()
      .then(orders => {
        console.log(`Listing open ${c.bold.yellowBright(pair)} ${platform} platform orders`)

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

        const toShow = []
        orders.forEach(o => {
          if (platform === constants.platform.trade && o.margin) return
          if (platform === constants.platform.margin) {
            if (!o.margin) return
          }
          if (platform === constants.platform.tram) {
            if (!o.margin && !o.tramID) return
          }
          toShow.push(o)
        })

        printOrders(api, toShow)

        resolve()
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  func.help = {
    descr: 'List open orders',
    format: `cm ${platform} open [${c.bold.red('pair')}]`,
    examples: [
      `cm ${platform} open ${c.bold.red('xcmeur')}`
    ]
  }

  return func
}

function history (platform) {
  function func (api, date=undefined, time=undefined) {
    return new Promise((resolve, reject) => {
      //pair = pair.toUpperCase()
      date = typeof date !== 'undefined' ? Date.parse(date, time) : Date.now() - 86400000 // by default display todays orders
      api.getOrderHistory(date)
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
          let d = formatDate(h.completionTime)
          let id = h.orderID

          let p1 = `${bc}${sc}`
          let p2 = `${sc}${bc}`

          if (btq === 0) return // ignore canceled orders
          //if (pair !== '' && pair !== p1 && pair !== p2) return
          if (date > h.creationTime) return

          if (platform === constants.platform.trade && h.margin) return
          if (platform === constants.platform.margin) {
            if (!h.margin) return
          }
          if (platform === constants.platform.tram) {
            if (!h.margin && !h.tramID) return
          }

          toShow.push(h)
        })

        if (toShow.length === 0) {
          console.log(c.bold.yellowBright('No orders found'))
          resolve()
          return
        } else {
          printOrders(api, toShow)
          resolve()
        }

      })
      .catch(err => {
        reject(err)
      })
    })
  }

  func.help = {
    descr: `List closed orders on ${platform} platform`,
    format: `cm ${platform} history [${c.bold.red('<pair')} ${c.bold.cyan('<kind filled|all>')} ${c.bold.greenBright('<since YYYY-MM-DD>')}]`,
    examples: [
      `cm ${platform} history ${c.bold.red('btceur')} ${c.bold.cyan('filled')} ${c.bold.greenBright('2020-04-05')}`
    ]
  }

  return func
}

function cancel (platform) {
  function func (api, id) {
    return new Promise((resolve, reject) => {
      //if id exists, cancel the order with that specific id
      constants.cancelOrder(id)
      .then(() => {
        console.log(`${c.bold.greenBright('Successfully')} canceled order ${id}`)
        resolve()
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  func.help = {
    descr: 'Cancel a specific order using its id',
    format: `cm ${platform} cancel ${c.bold.red('<order id>')}`,
    examples: [
      `cm ${platform} cancel ${c.bold.red('5a902cb722a7b962b93234dsfd9b15895286891136ed60b54270a136b')}`
    ]
  }

  return func
}

function mcancel (platform) {
  function func (api, pair='', mode=constants.cancelMode.byprice, ...args) {
    pair = pair.toUpperCase()
    if (mode === constants.cancelMode.byprice) {
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

  func.help = {
    descr: 'Cancel multiple orders matching the criteria',
    format: `cm ${platform} mcancel ${c.bold.red('<pair>')} ${c.bold.cyan('<mode byprice|bydate>')} ${c.bold.green('@<start price>-<end price>|<start date YYYY-MM-DD> <start time hh:mm:ss> <end date YYYY-MM-DD> <end time hh:mm:ss>')}`,
    examples: [
      `cm ${platform} mcancel ${c.bold.red('xcmeur')} ${c.bold.cyan('byprice')} ${c.bold.green('@0.03-0.04')}`,
      `cm ${platform} mcancel ${c.bold.red('xcmeur')} ${c.bold.cyan('bydate')} ${c.bold.green('2020-01-07 7:00 2020-01-09 12:00')}`
    ]
  }

  return func
}

function trade (platform, operation) {
  function func (api, q1, c1, p, c2, tif=constants.timeInForce.gtc, d=5) {
    return new Promise((resolve, reject) => {
      q1 = parseFloat(q1)
      c1 = c1.toUpperCase()
      p = parseFloat(p.replace('@', ''))
      c2 = c2.toUpperCase()
      tif = tif.toUpperCase()
      d = parseFloat(d)
      const pair = findPair(c1, c2)

      let q2 = q1 * p
      if (pair.indexOf(c1) !== 0) {
        // this is an inverse operation
        q2 = q1 / p
        c1 = [c2, c2 = c1][0]
        q1 = [q2, q2 = q1][0]
        operation = operation === constants.operation.buy ? constants.operation.sell : constants.operation.buy
      }

      const req = {
        orderPlatform: platform,
        orderType: 'limit',
        fillStyle: operation,
        buyingCurrency: operation === constants.operation.buy ? c1 : c2,
        sellingCurrency: operation === constants.operation.sell ? c1 : c2,
        buyingQty: operation === constants.operation.buy ? q1 : q2,
        sellingQty: operation === constants.operation.sell ? q1 : q2,
        timeInForce: tif
      }
      if (platform === constants.platform.margin) { req.margin = true }
      if (tif === constants.timeInForce.gtd.toUpperCase()) { req.expirationTime = Date.now() + d * 1000 }
      api.sendOrder(req)
      .then(order => {
        console.log(c.greenBright('Success!'))
        printOrders(api, [order])
        resolve()
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  const counterop = operation === constants.operation.buy ? constants.operation.sell : constants.operation.buy

  func.help = {
    descr: `Send a ${operation} orders`,
    format: `cm ${platform} ${operation} ${c.bold.red(`<${operation} quantity> <${operation} currency>`)} ${c.bold.cyan('@<price>')} ${c.bold.green(`<${counterop} currency>`)} [${c.bold.yellow('<time in force: gtc|ioc|gtd|fok>')} ${c.bold.white('<duration (s)>')}]`,
    examples: [
      `cm ${platform} ${operation} ${c.bold.red('10000 xcm')} ${c.bold.cyan('@1.2')} ${c.bold.green('eur')} ${c.bold.yellow('gtd')} ${c.bold.white('10')}`,
    ]
  }

  return func
}

function mtrade (platform, operation) {
  function func (api, q1, c1, p, c2, n, tif=constants.timeInForce.gtc, d=5) {
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
      const pair = findPair(c1, c2)

      let inverse = false
      if (pair.indexOf(c1) !== 0) {
        // this is an inverse operation
        inverse = true
        c1 = [c2, c2 = c1][0]
        operation = operation === constants.operation.buy ? constants.operation.sell : constants.operation.buy
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
          buyingCurrency: operation === constants.operation.buy ? c1 : c2,
          sellingCurrency: operation === constants.operation.sell ? c1 : c2,
          buyingQty: operation === constants.operation.buy ? nq1 : nq2,
          sellingQty: operation === constants.operation.sell ? nq1 : nq2,
          timeInForce: tif
        }
        if (platform === constants.platform.margin) { req.margin = true }
        if (tif === constants.timeInForce.gtd.toUpperCase()) { req.expirationTime = Date.now() + d * 1000 }

        orders.push(api.sendOrder(req))
      }

      Promise.all(orders)
      .then(orders => {
        console.log(c.greenBright('Success! The following orders were created:'))
        printOrders(api, orders)
        resolve()
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  const counterop = operation === constants.operation.buy ? constants.operation.sell : constants.operation.buy

  func.help = {
    descr: `Perform iceberg ${operation} dividing a single order into a number of chunks (separate orders) within a specified price range`,
    format: `cm limit m${operation} ${c.bold.red(`<${operation} quantity> <${operation} currency>`)} ${c.bold.cyan('@<start price>-<end price>')} ${c.bold.green(`<${counterop} currency>`)} ${c.bold.magenta('<order count>')} [${c.bold.yellow('<time in force: gtc|ioc|gtd|fok>')} ${c.bold.white('<duration (s)>')}]`,
    examples: [
      `cm limit m${operation} ${c.bold.red('10000 xcm')} ${c.bold.cyan('@1.2-2.2')} ${c.bold.green('eur')} ${c.bold.magenta('10')} ${c.bold.yellow('gtc')} ${c.bold.white('10')}`,
    ]
  }

  return func
}

module.exports.readObj = readObj
module.exports.writeObj = writeObj
module.exports.formatDate = formatDate
module.exports.open = open
module.exports.history = history
module.exports.cancel = cancel
module.exports.mcancel = mcancel
module.exports.trade = trade
module.exports.mtrade = mtrade
module.exports.printOrders = printOrders
module.exports.printHelp = printHelp
