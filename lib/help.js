module.exports.help = function (func) {
  if (!!func.help) {
    console.log(c.yellow('No help found for this command'))
    return
  }

}