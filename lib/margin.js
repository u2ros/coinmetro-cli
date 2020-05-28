module.exports.collateral = function (api) {
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
