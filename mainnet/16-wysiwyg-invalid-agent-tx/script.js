const {
  script: { agentAddress, ensContract, ensDomain, targetAgent },
} = require('./metadata')
const {
  encodeSetEnsOwnerThroughAgent,
  encodeCallsScript,
} = require('../../lib/encoder')

module.exports = async () => {
  const data = encodeSetEnsOwnerThroughAgent(
    ensContract,
    ensDomain,
    targetAgent
  )
  return encodeCallsScript([{ to: agentAddress, data: data }])
}
