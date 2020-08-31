const {
  voting,
  script: {
    acl,
    // This variable is needed as if we leave the index param in the `buildNonceForAddress`
    // function as 0, it will calculate the ACL address. For determining what number to assign,
    // we need to count the number of apps installed, and then add 1.
    appIndex,
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
  const nonce = await buildNonceForAddress(voting, appIndex)
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
