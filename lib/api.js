const axios = require('axios')

module.exports = function (demo=false) {
  const module = {}
  const open = demo ? 'open/' : ''

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

  module.getWallets = function() {
    return new Promise((resolve, reject) => {
      axios.get(`https://api.coinmetro.com/${open}users/wallets`)
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
      expirationTime,
      margin
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
          expirationTime,
          margin
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
        reject(err)
      })
    })
  }


/*
balance: 550
balanceHistory: []
createdAt: "2020-06-03T18:32:11.619Z"
currency: "EUR"
disabled: false
id: "5ed7ecabb177e09892ad3379"
label: "u2ros-test2"
refList: []
totalDeposit: 550
totalWithdraw: 0
updatedAt: "2020-06-03T19:08:12.375Z"
userId: "5a902cb722a7b962b9330a9b"
xcmLockAmounts: []
xcmLocks: []
__v: 0
_id: "5ed7ecabb177e09892ad3379"
 */
  module.tramAllocate = function (label, amount, currency) {
    return new Promise((resolve, reject) => {
      axios.post(
        `https://api.coinmetro.com/${open}tram/allocate`,
        {
          label,
          amount,
          currency
        }
      ).then(async result => {
        resolve(result.data)
      }).catch(err => {
        reject(err)
      })
    })
  }


  module.getTramBalance = function (label) {
    return new Promise((resolve, reject) => {
      axios.get(
        `https://exchange.coinmetro.com/${open}tram/wallets/${label}`,
      ).then(async result => {
        resolve(result.data)
      }).catch(err => {
        reject(err)
      })
    })
  }

  module.getMargin = function () {
    return new Promise((resolve, reject) => {
      axios.get(
        `https://exchange.coinmetro.com/${open}margin`,
      ).then(async result => {
        resolve(result.data)
      }).catch(err => {
        reject(err)
      })
    })
  }

  module.setMarginCollateral = function (amount, currency) {
    return new Promise((resolve, reject) => {
      axios.post(
        `https://api.coinmetro.com/${open}users/margin/collateral`,
        { [currency]: amount }
      ).then(async result => {
        resolve(result.data)
      }).catch(err => {
        reject(err)
      })
    })
  }

  return module
}
