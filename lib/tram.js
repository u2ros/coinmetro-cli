module.exports.collateral = function (api, name) {
  return new Promise((reject, resolve) => {
    api.getTramBalance(name)
    .then(balances => {
      console.log(balances)
    })
    .catch(err => {
      console.log(err)
    })
  })
}