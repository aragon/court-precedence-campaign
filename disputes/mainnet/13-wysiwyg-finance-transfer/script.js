const { script: { finance, token, receiver, amount, reference } } = require('./metadata')
const { encodeNewImmediatePayment, encodeCallsScript } = require('../../../helpers/lib/encoder')

module.exports = async () => {
  const data = encodeNewImmediatePayment(token, receiver, amount, reference)
  return encodeCallsScript([{ to: finance, data: data }])
}
