module.exports.formatDate = function (miliseconds) {
  const date = new Date(miliseconds)
  const Y = date.getFullYear().toString()
  const M = (date.getMonth() + 1).toString().padStart(2, '0')
  const D = (date.getDate()).toString().padStart(2, '0')
  const h = date.getHours().toString().padStart(2, '0')
  const m = (date.getMinutes()).toString().padStart(2, '0')
  const s = (date.getSeconds()).toString().padStart(2, '0')
  return `${Y}-${M}-${D} ${h}:${m}:${s}`
}

module.exports.parseDate = function (date, time) {
  const { Y, M, D } = date.split('-')
  const { h, m, s } = time.split(':')

  Y = parseInt(Y)
  M = parseInt(M) - 1
  D = parseInt(D) - 1

  h = parseInt(h)
  m = parseInt(m)
  s = parseInt(s)
}

module.exports.printHelp = function (context, subcommand) {
  console.log(context[subcommand].help.descr)
  console.log('\nSyntax:')
  console.log(context[subcommand].help.format)
  console.log('\nExample:')
  context[subcommand].help.examples.forEach(snippet => {
    console.log(snippet)
  })
  console.log('\n')
}
