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