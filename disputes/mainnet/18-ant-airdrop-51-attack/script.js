const { script: { finance, token, attackContract, amount, reference } } = require('./metadata')
const { encodeNewImmediatePayment, encodeCallsScript } = require('../../../helpers/lib/encoder')

module.exports = async () => {
  const data = encodeNewImmediatePayment(token, attackContract, amount, reference)
  return encodeCallsScript([{ to: finance, data: data }])
}
