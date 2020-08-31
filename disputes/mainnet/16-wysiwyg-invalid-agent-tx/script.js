const { script: { agent, ensContract, ensDomain, newOwner } } = require('./metadata')
const { encodeSetEnsOwnerThroughAgent, encodeCallsScript } = require('../../../helpers/lib/encoder')

module.exports = async () => {
  const data = encodeSetEnsOwnerThroughAgent(
    ensContract,
    ensDomain,
    newOwner
  )
  return encodeCallsScript([{ to: agent, data: data }])
}
