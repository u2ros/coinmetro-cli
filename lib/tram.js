module.exports.collateral = function (api, name) {
  return new Promise((resolve, reject) => {
    api.getTramBalance(name)
    .then(balances => {
      console.log(balances)
    })
    .catch(err => {
      console.log(err)
    })
  })
}

/* limit buy
{margin: true, trade: false, orderType: "limit", timeInForce: "GTC", userData: {},…}
buyingCurrency: "BTC"
buyingQty: 0.1
margin: true
orderPlatform: "margin"
orderType: "limit"
sellingCurrency: "EUR"
sellingQty: 500
timeInForce: "GTC"
trade: false
tramID: "5ed7ecabb760f41a96177472"
userData: {}

response:
boughtQty: 0
buyingCurrency: "BTC"
buyingQty: 0.1
creationTime: 1591212020517
margin: true
orderID: "5ed7ecabb760f41a96177472159121202050281a2dc4140bb83e6"
orderPlatform: "margin"
orderType: "limit"
sellingCurrency: "EUR"
sellingQty: 500
seqNumber: 689922896
soldQty: 0
timeInForce: 1
trade: false
tramID: "5ed7ecabb760f41a96177472"
userData: {}
userID: "5ed7ecabb760f41a96177472"
*/

/**
 https://exchange.coinmetro.com/orders/tram/5ed7ecabb760f41a96177472/active

 boughtQty: 0
buyingCurrency: "BTC"
buyingQty: 0.1
creationTime: 1591212020517
fees: 0
margin: true
orderID: "5ed7ecabb760f41a96177472159121202050281a2dc4140bb83e6"
orderPlatform: "margin"
orderType: "limit"
sellingCurrency: "EUR"
sellingQty: 500
seqNumber: 689922896
settledQtys: {}
soldQty: 0
timeInForce: 1
trade: false
tramID: "5ed7ecabb760f41a96177472"
userData: {}
userID: "5ed7ecabb760f41a96177472"
 */