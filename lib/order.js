const c = require('ansi-colors')
const env = require('./env')
const utils = require('./utils')

function printOrders(api, orders, pair) {
  orders.forEach(o => {
    let bc = o.buyingCurrency
    let sc = o.sellingCurrency
    let bq = o.buyingQty
    let btq = o.boughtQty
    let sq = o.sellingQty
    let sdq = o.soldQty
    let p1 = `${bc}${sc}`
    let p = pair === p1 ? sq / bq : bq / sq
    let filled = pair === p1 ? (100.00 * btq / bq).toFixed(2) : (100.00 * sdq / sq).toFixed(2)
    p = p.toFixed(3).padStart(9)
    bq = bq.toFixed(3)
    sq = sq.toFixed(3)
    let date = utils.formatDate(o.creationTime)

    if (typeof o.tramID !== 'undefined') return

    if (pair === p1) {
      console.log(`${c.bold.green('B')} ${bq.padStart(10)}${bc.padEnd(3)} ${c.yellowBright('@' + p)} for ${sq.padStart(12)}${sc} ${filled}% ${api.tif[o.timeInForce]} ${c.dim(date)} ${c.dim(o.orderID)}`)
    } else {
      console.log(`${c.bold.red  ('S')} ${sq.padStart(10)}${sc.padEnd(3)} ${c.yellowBright('@' + p)} for ${bq.padStart(12)}${bc} ${filled}% ${api.tif[o.timeInForce]} ${c.dim(date)} ${c.dim(o.orderID)}`)
    }
  })
}

const sort = {
  byprice (a, b) {
    return a.buyingQty/a.sellingQty >= b.buyingQty / b.sellingQty ? -1 : 1
  },
  bydate(a, b) {
    return a.creationTime > b.creationTime ? 1 : -1
  }
}

module.exports.list = function (api, pair, product=api.product.ex, orderby=api.order.byprice) {
  if (typeof pair === 'undefined') throw "Missing pair argument"

  return new Promise((resolve, reject) => {
    api.getOpenOrders()
    .then(orders => {
      console.log(`Listing ${product} platform orders for ${c.bold.yellowBright(pair)}`)

      if (typeof pair === 'undefined') {  } //TODO raise
      pair = pair.toUpperCase()

      orders = orders.filter(o => {
        let p1 = `${o.buyingCurrency}${o.sellingCurrency}`
        let p2 = `${o.sellingCurrency}${o.buyingCurrency}`
        return (pair === p1 || pair === p2) ? true : false
      })

      orders.sort(sort[orderby])

      if (!orders.length) {
        console.log('No orders found')
        resolve()
        return
      }
      printOrders(api, orders, pair)

      resolve()
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.list.help = {
  descr: 'List open orders',
  format: `cm order open [${c.bold.red('pair')} ${c.bold.cyan('<product ex|tram>')} ${c.bold.greenBright('<order byprice|bydate>')}]`,
  examples: [
    `cm order open ${c.bold.red('xcmeur')} ${c.bold.cyan('ex')} ${c.bold.greenBright('byprice')}`
  ]
}

module.exports.history = function (api, pair, kind = api.history.filled, since=null) {
  if (typeof pair === 'undefined') throw "Missing pair argument"

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

        if (pair !== p1 && pair !== p2) return
        if (kind === api.history.filled && btq === 0) return
        if (since > new Date(h.creationTime)) return

        toShow.push(h)
      })

      printOrders(api, toShow, pair)
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.history.help = {
  descr: 'List closed orders',
  format: `cm order history ${c.bold.red('<pair')} [${c.bold.cyan('<kind filled|all>')} ${c.bold.greenBright('<since YYYY-MM-DD>')}]`,
  examples: [
    `cm order history ${c.bold.red('btceur')} ${c.bold.cyan('filled')} ${c.bold.greenBright('2020-04-05>')}`
  ]
}

module.exports.cancel = function (cm, id) {
  return new Promise((resolve, reject) => {
    //if id exists, cancel the order with that specific id
    cm.cancelOrder(id)
    .then(() => {
      console.log(`Successfully canceled order ${id}`)
      resolve()
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.cancel.help = {
  descr: 'Cancel a specific order using its id',
  format: `cm order cancel ${c.bold.red('<order id>')}`,
  examples: [
    `cm order cancel ${c.bold.red('5a902cb722a7b962b93234dsfd9b15895286891136ed60b54270a136b')}`
  ]
}

const filter = {
  byprice(o, from, to) {
    return o.price <  from || o.price > to
  },
  bydate(o, from, to) {
    return o.creationTime < from || o.creationTime > to
  }
}

module.exports.mcancel = function (api, pair, mode=api.cancelMode.byprice, ...args) {
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
        if (p1 !== pair && p2 !== pair) { del = false }
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
module.exports.mcancel.help = {
  descr: 'Cancel multiple orders mathing the criteria',
  format: `cm order mcancel ${c.bold.red('<pair>')} ${c.bold.cyan('<mode byprice|bydate>')} ${c.bold.green('@<start price>-<end price>|<start date YYYY-MM-DD> <start time hh:mm> <end date YYYY-MM-DD> <end time hh:mm>')}`,
  examples: [
    `cm order mcancel ${c.bold.red('xcmeur')} ${c.bold.cyan('byprice')} ${c.bold.green('@0.03-0.04')}`,
    `cm order mcancel ${c.bold.red('xcmeur')} ${c.bold.cyan('bydate')} ${c.bold.green('2020-01-07 7:00 2020-01-09 12:00')}`
  ]
}

module.exports.buy = function (api, bq, bc, p, sc, tif=api.timeInForce.gtc, d=5) {
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
      printOrders(api, [order], pair)
      resolve()
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.buy.help = {
  descr: 'Send a buy orders',
  format: `cm order buy ${c.bold.red('<buy quantity> <buy currency>')} ${c.bold.cyan('@<price>')} ${c.bold.green('<sell currency>')} [${c.bold.yellow('<time in force: gtc|ioc|gtd|fok>')} ${c.bold.white('<duration (s)>')}]`,
  examples: [
    `cm order buy ${c.bold.red('10000 xcm')} ${c.bold.cyan('@0.75')} ${c.bold.green('eur')} ${c.bold.yellow('gtd')} ${c.bold.white('10')}`,
  ]
}

module.exports.sell = function (api, sq, sc, p, bc, tif=api.timeInForce.gtc, d=5) {
  return new Promise((resolve, reject) => {
    sq = parseFloat(sq)
    sc = sc.toUpperCase()
    p = parseFloat(p.replace('@', ''))
    bc = bc.toUpperCase()
    tif = tif.toUpperCase()
    d = parseFloat(d)

    const bq = sq * p
    const req = {
      orderPlatform: 'trade', // margin not supported atm
      orderType: 'limit',     // limit orders only
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
      printOrders(api, [order], pair)
      resolve()
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.sell.help = {
  descr: 'Send a sell orders',
  format: `cm order sell ${c.bold.red('<sell quantity> <sell currency>')} ${c.bold.cyan('@<price>')} ${c.bold.green('<buy currency>')} [${c.bold.yellow('<time in force: gtc|ioc|gtd|fok>')} ${c.bold.white('<duration (s)>')}]`,
  examples: [
    `cm order sell ${c.bold.red('10000 xcm')} ${c.bold.cyan('@0.75')} ${c.bold.green('eur')} ${c.bold.yellow('gtd')} ${c.bold.white('10')}`,
  ]
}

module.exports.mbuy = function (api, bq, bc, p, sc, n, tif=api.timeInForce.gtc, d=5) {
  return new Promise((resolve, reject) => {
    bq = parseFloat(bq)
    bc = bc.toUpperCase()
    let [p1, p2] = p.replace('@', '').split('-')
    p1 = parseFloat(p1)
    p2 = parseFloat(p2)
    sc = sc.toUpperCase()
    n = parseInt(n)
    tif = tif.toUpperCase()
    d = parseFloat(d)

    const incr = (p2 - p1) / (n - 1)
    const orders = []
    for (let i=0; i<n; i++) {
      let p = p1 + i * incr

      let nbq = bq / n
      let nsq = nbq * p
      let req = {
        orderPlatform: 'trade', // margin not supported atm
        orderType: 'limit',     // limit orders only
        fillStyle: 'sell',
        buyingCurrency: bc,
        sellingCurrency: sc,
        buyingQty: nbq,
        sellingQty: nsq,
        timeInForce: tif
      }
      if (tif === api.timeInForce.gtd.toUpperCase()) { req.expirationTime = Date.now() + d * 1000 }

      orders.push(api.sendOrder(req))
    }

    Promise.all(orders)
    .then(orders => {
      console.log(c.greenBright('Success! The following orders were created:'))
      pair = `${orders[0].buyingCurrency}${orders[0].sellingCurrency}`
      printOrders(api, orders, pair)
      resolve()
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.mbuy.help = {
  descr: 'Perform iceberg buy dividing a single order into a number of chunks (separate orders) within a specified price range',
  format: `cm order mbuy ${c.bold.red('<buy quantity> <buy currency>')} ${c.bold.cyan('@<start price>-<end price>')} ${c.bold.green('<sell currency>')} ${c.bold.magenta('<order count>')} [${c.bold.yellow('<time in force: gtc|ioc|gtd|fok>')} ${c.bold.white('<duration (s)>')}]`,
  examples: [
    `cm order mbuy ${c.bold.red('10000 xcm')} ${c.bold.cyan('@0.01-0.02')} ${c.bold.green('eur')} ${c.bold.magenta('10')} ${c.bold.yellow('gtc')} ${c.bold.white('10')}`,
  ]
}

module.exports.msell = function (api, sq, sc, p, bc, n, tif=api.timeInForce.gtc, d=5) {
  return new Promise((resolve, reject) => {
    sq = parseFloat(sq)
    sc = sc.toUpperCase()
    let [p1, p2] = p.replace('@', '').split('-')
    p1 = parseFloat(p1)
    p2 = parseFloat(p2)
    bc = bc.toUpperCase()
    n = parseInt(n)
    tif = tif.toUpperCase()
    d = parseFloat(d)

    const incr = (p2 - p1) / (n - 1)
    const orders = []
    for (let i=0; i<n; i++) {
      let p = p1 + i * incr

      let nsq = sq / n
      let nbq = nsq * p
      let req = {
        orderPlatform: 'trade', // margin not supported atm
        orderType: 'limit',     // limit orders only
        fillStyle: 'sell',
        buyingCurrency: bc,
        sellingCurrency: sc,
        buyingQty: nbq,
        sellingQty: nsq,
        timeInForce: tif
      }
      if (tif === api.timeInForce.gtd.toUpperCase()) { req.expirationTime = Date.now() + d * 1000 }

      orders.push(api.sendOrder(req))
    }

    Promise.all(orders)
    .then(orders => {
      console.log(c.greenBright('Success! The following orders were created:'))
      pair = `${orders[0].sellingCurrency}${orders[0].buyingCurrency}`
      printOrders(api, orders, pair)
      resolve()
    })
    .catch(err => {
      reject(err)
    })
  })
}
module.exports.msell.help = {
  descr: 'Perform iceberg sell by dividing a single order into a number of chunks (separate orders) within a specified price range',
  format: `cm order msell ${c.bold.red('<sell quantity> <sell currency>')} ${c.bold.cyan('@<start price>-<end price>')} ${c.bold.green('<buy currency>')} ${c.bold.magenta('<order count>')} [${c.bold.yellow('<time in force: gtc|ioc|gtd|fok>')} ${c.bold.white('<duration (s)>')}]`,
  examples: [
    `cm order msell ${c.bold.red('10000 xcm')} ${c.bold.cyan('@0.5-0.6')} ${c.bold.green('EUR')} ${c.bold.magenta('10')} ${c.bold.yellow('gtc')} ${c.bold.white('10')}`,
  ]
}