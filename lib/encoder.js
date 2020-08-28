const abi = require('web3-eth-abi')
const FINANCE_ABI = require('../artifacts/Finance.json').abi
const FORWARDER_ABI = require('../artifacts/IForwarderWithContext.json').abi

const CALLSCRIPT_ID = '0x00000001'

function encodeCallsScript(actions) {
  return actions.reduce((script, { to, data }) => {
    const address = abi.encodeParameter('address', to)
    const dataLength = abi.encodeParameter('uint256', (data.length - 2) / 2).toString('hex')
    return script + address.slice(26) + dataLength.slice(58) + data.slice(2)
  }, CALLSCRIPT_ID)
}

function encodeNewImmediatePayment(token, receiver, amount, reference) {
  const newImmediatePaymentABI = getFunctionABI(FINANCE_ABI, 'newImmediatePayment')
  return abi.encodeFunctionCall(newImmediatePaymentABI, [token, receiver, amount, reference])
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
  encodeNewImmediatePayment,
  encodeCallsScript,
}
