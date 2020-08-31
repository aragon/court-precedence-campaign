const {
  script: {
    acl,
    kernel,
    vaultAddress,
    appId,
    appBase,
    entity,
    role,
    manager,
  },
} = require('./metadata')
const {
  encodeNewRewardsAppInstance,
  encodeCallsScript,
} = require('../../lib/encoder')
const {
  buildNonceForAddress,
  calculateNewProxyAddress,
} = require('../../lib/web3-utils')

module.exports = async () => {
  const nonce = await buildNonceForAddress(kernel, 0)
  const counterfactualAppAddress = await calculateNewProxyAddress(kernel, nonce)
  const [installData, permissionData] = encodeNewRewardsAppInstance(
    counterfactualAppAddress,
    vaultAddress,
    appId,
    appBase,
    entity,
    role,
    manager
  )
  return encodeCallsScript([
    { to: kernel, data: installData },
    { to: acl, data: permissionData },
  ])
}
