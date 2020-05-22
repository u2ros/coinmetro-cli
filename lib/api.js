const axios = require('axios')

module.exports = function (demo=false) {
  const module = {}
  const open = demo ? 'open/' : ''

  module.chart = {
    d: { timeframe: 300000, duration: 86400000, label: 'Daily' },
    w: { timeframe: 1800000, duration: 604800000, label: 'Weeky' },
    m: { timeframe: 14400000, duration: 2592000000, label: 'Monthly' },
    y: { timeframe: 86400000, duration: 31449600000, label: 'Yearly' }
  }

  module.orderPlatform = {
    trade: 'trade',
    margin: 'margin'
  }

  module.product = {
    ex: 'exchange',
    tram: 'tram'
  }

  module.timeInForce = {
    gtc: 'gtc', // good till canceled
    ioc: 'ioc', // immediate or cancel
    gtd: 'gtd', // good till date
    fok: 'fok'  // fill or kill
  }

  module.tif = { // TODO: reverse lookup, may not be required in the future
    [1]: 'GTC',
    [2]: 'IOC',
    [3]: 'GTD',
    [4]: 'FOK'
  }

  module.cancelMode = {
    byprice: 'byprice',
    bydate: 'bydate'
  }

  module.history = {
    all: 'all',
    filled: 'filled'
  }

  module.orderby = {
    byprice: 'byprice',
    bydate: 'bydate'
  }

  module.login = function (login, password) {
    return new Promise((resolve, reject) => {
      axios.post(`https://api.coinmetro.com/${open}jwt`, { login, password, 'g-recaptcha-response': '1982efn1928ehasd' })
      .then(result => {
        resolve(result.data)
      }).catch(err => {
        reject(err)
      })
    })
  }

  module.getBalances = function() {
    return new Promise((resolve, reject) => {
      axios.get(`https://api.coinmetro.com/${open}users/balances`)
      .then(async result => {
        resolve(result.data)
      }).catch(err => {
        reject(err)
      })
    })
  }

  module.getOpenOrders = function () {
    return new Promise((resolve, reject) => {
      axios.get(`https://exchange.coinmetro.com/${open}orders/active`).then(async result => {
        resolve(result.data)
      }).catch(err => {
        reject(err)
      })
    })
  }

  module.getOrderHistory = function (since) {
    return new Promise((resolve, reject) => {
      axios.get(`https://exchange.coinmetro.com/${open}orders/history/`, {
        since
      }).then(async result => {
        resolve(result.data)
      }).catch(err => {
        reject(err)
      })
    })
  }

  module.sendOrder = function ({ // no margin support atm
      orderPlatform,
      orderType,
      fillStyle,
      buyingCurrency,
      sellingCurrency,
      buyingQty,
      sellingQty,
      timeInForce,
      expirationTime
    }) {
    return new Promise((resolve, reject) => {
      axios.post(
        `https://exchange.coinmetro.com/${open}orders/create`,
        {
          orderPlatform,
          orderType,
          fillStyle,
          buyingCurrency,
          sellingCurrency,
          buyingQty,
          sellingQty,
          timeInForce,
          expirationTime
        },
      ).then(async result => {
        resolve(result.data)
      }).catch(err => {
        reject(err)
      })
    })
  }

  module.cancelOrder = function (orderID) {
    return new Promise((resolve, reject) => {
      axios.put(
        `https://exchange.coinmetro.com/${open}orders/cancel/${orderID}`
      ).then(async result => {
        resolve(result.data)
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    })
  }

  module.getFullBook = function (pair) {
    return new Promise((resolve, reject) => {
      axios.get(
        `https://exchange.coinmetro.com/${open}book/${pair}`,
      ).then(async result => {
        resolve(result.data)
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    })
  }

  module.getTrades = function (pair, from) {
    return new Promise((resolve, reject) => {
      axios.get(
        `https://exchange.coinmetro.com/${open}ticks/${pair}/${from}`,
      ).then(async result => {
        resolve(result.data)
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    })
  }

  module.getBookUpdates = function (pair, from) {
    return new Promise((resolve, reject) => {
      axios.get(
        `https://exchange.coinmetro.com/${open}bookUpdates/${pair}/${from}`,
      ).then(async result => {
        resolve(result.data)
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    })
  }

  module.getLatestPrices = function () {
    return new Promise((resolve, reject) => {
      axios.get(
        `https://exchange.coinmetro.com/${open}prices`,
      ).then(async result => {
        resolve(result.data.latestPrices)
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    })
  }

  module.getHistoricalPrices = function (pair, options) {
    return new Promise((resolve, reject) => {
      const from = Date.now() - options.duration
      axios.get(
        `https://exchange.coinmetro.com/${open}candles/${pair}/${options.timeframe}/${from}`, //ignoring /${to}
      ).then(async result => {
        resolve(result.data.candleHistory)
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    })
  }

  return module
}
