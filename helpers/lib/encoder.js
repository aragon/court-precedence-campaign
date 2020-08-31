const abi = require('web3-eth-abi')
const namehash = require('eth-ens-namehash')
const ACL_ABI = require('../artifacts/Acl.json').abi
const AGENT_ABI = require('../artifacts/Agent.json').abi
const ENS_ABI = require('../artifacts/ENS.json').abi
const FINANCE_ABI = require('../artifacts/Finance.json').abi
const FORWARDER_ABI = require('../artifacts/IForwarderWithContext.json').abi
const KERNEL_ABI = require('../artifacts/Kernel.json').abi
const REWARDS_ABI = require('../artifacts/Rewards.json').abi

const CALLSCRIPT_ID = '0x00000001'
const EMPTY_HEX = '0x00'

function encodeCallsScript(actions) {
  return actions.reduce((script, { to, data }) => {
    const address = abi.encodeParameter('address', to)
    const dataLength = abi.encodeParameter('uint256', (data.length - 2) / 2).toString('hex')
    return script + address.slice(26) + dataLength.slice(58) + data.slice(2)
  }, CALLSCRIPT_ID)
}

function encodeSetEnsOwnerThroughAgent(ensContract, ensDomain, newOwner) {
  const ensABI = getFunctionABI(ENS_ABI, 'setOwner')
  const ancashNamehash = namehash.hash(ensDomain)
  const setOwnerAction = abi.encodeFunctionCall(ensABI, [ancashNamehash, newOwner])
  const agentABI = getFunctionABI(AGENT_ABI, 'execute')
  return abi.encodeFunctionCall(agentABI, [ensContract, EMPTY_HEX, setOwnerAction])
}

function encodeNewRewardsAppInstance(counterfactualAppAddress, vaultAddress, appId, appBase, entity, role, manager) {
  const initializeABI = getFunctionABI(REWARDS_ABI, 'initialize')
  const initPayload = abi.encodeFunctionCall(initializeABI, [vaultAddress])
  const newAppInstanceABI = getFunctionABI(KERNEL_ABI, 'newAppInstance')
  const newAppInstanceFunc = abi.encodeFunctionCall(newAppInstanceABI, [appId, appBase, initPayload, false])
  const aclAbi = getFunctionABI(ACL_ABI, 'createPermission')
  const permissionsFunc = abi.encodeFunctionCall(aclAbi, [entity, counterfactualAppAddress, role, manager])
  return [newAppInstanceFunc, permissionsFunc]
}

function encodeNewImmediatePayment(token, receiver, amount, reference) {
  const newImmediatePaymentABI = getFunctionABI(FINANCE_ABI, 'newImmediatePayment')
  return abi.encodeFunctionCall(newImmediatePaymentABI, [token, receiver, amount, reference])
}

function encodeGrantPermission(entity, app, role) {
  const aclAbi = getFunctionABI(ACL_ABI, 'grantPermission')
  return abi.encodeFunctionCall(aclAbi, [entity, app, role])
}

function encodeForward(script) {
  const forwardABI = getFunctionABI(FORWARDER_ABI, 'forwardWithContext')
  return abi.encodeFunctionCall(forwardABI, [script])
}

function getFunctionABI(ABI, functionName) {
  const functionABI = ABI.find(item => item.type === 'function' && item.name === functionName)
  if (!functionABI) throw Error(`Could not find function ABI called ${functionName}`)
  return functionABI
}

module.exports = {
  encodeForward,
  encodeCallsScript,
  encodeGrantPermission,
  encodeNewRewardsAppInstance,
  encodeNewImmediatePayment,
  encodeSetEnsOwnerThroughAgent,
}
