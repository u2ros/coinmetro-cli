module.exports.pairs = [
  '1INCHEUR',
  '1INCHUSD',
  'AAVEEUR',
  'AAVEUSD',
  'ALBTEUR',
  'BANDEUR',
  'BANDUSD',
  'BATEUR',
  'BCHEUR',
  'BCHUSD',
  'BTCAUD',
  'BTCEUR',
  'BTCGBP',
  'BTCUSD',
  'DNAUSD',
  'ENJEUR',
  'ETHAUD',
  'ETHBTC',
  'ETHEUR',
  'ETHGBP',
  'ETHUSD',
  'FLUXEUR',
  'FLUXUSD',
  'HTREUR',
  'KDAEUR',
  'KDAUSD',
  'LINKEUR',
  'LINKUSD',
  'LTCBTC',
  'LTCEUR',
  'LTCUSD',
  'LUNAEUR',
  'LUNAUSD',
  'MIRETH',
  'OCEANEUR',
  'OCEANUSD',
  'OMGEUR',
  'PRQBETH',
  'PRQEUR',
  'QNTBTC',
  'QNTEUR',
  'QNTUSD',
  'QRDOUSD',
  'SNXEUR',
  'SNXUSD',
  'SUSHIEUR',
  'SUSHIUSD',
  'THTEUR',
  'THTUSD',
  'UNIEUR',
  'UNIUSD',
  'USDCEUR',
  'USTEUR',
  'VSPUSD',
  'VXVUSD',
  'WHLEUR',
  'WHLUSD',
  'XCMETH',
  'XCMEUR',
  'XCMUSD',
  'XLMEUR',
  'XRPBTC',
  'XRPEUR',
  'XRPGBP',
  'XRPUSD',
  'XTZEUR'
]

module.exports.chart = {
  d: { timeframe: 300000, duration: 86400000, label: 'Daily' },
  w: { timeframe: 1800000, duration: 604800000, label: 'Weeky' },
  m: { timeframe: 14400000, duration: 2592000000, label: 'Monthly' },
  y: { timeframe: 86400000, duration: 31449600000, label: 'Yearly' }
}

module.exports.platform = {
  trade: 'trade',   // for market and limit orders
  margin: 'margin', // for margin and tram? orders
  tram: 'tram'      // for tram platform
}

module.exports.operation = {
  buy: 'buy',
  sell: 'sell'
}

module.exports.orderType = {
  limit: 'limit',
  margin: 'limit',
  tram: 'tram'
}

module.exports.timeInForce = {
  gtc: 'gtc', // good till canceled
  ioc: 'ioc', // immediate or cancel
  gtd: 'gtd', // good till date
  fok: 'fok'  // fill or kill
}

module.exports.tif = { // TODO: reverse lookup, may not be required in the future
  [1]: 'GTC',
  [2]: 'IOC',
  [3]: 'GTD',
  [4]: 'FOK'
}

module.exports.cancelMode = {
  byprice: 'byprice',
  bydate: 'bydate'
}

module.exports.history = {
  all: 'all',
  filled: 'filled'
}

module.exports.sort = {
  byprice: 'byprice',
  bydate: 'bydate'
}