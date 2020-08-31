const RLP = require('rlp')

// functions for counterfactual addresses
async function buildNonceForAddress(address, index) {
  const txCount = await web3.eth.getTransactionCount(address)
  return `0x${(txCount + index).toString(16)}`
}

async function calculateNewProxyAddress(daoAddress, nonce) {
  const rlpEncoded = RLP.encode([daoAddress, nonce])
  const contractAddressLong = web3.utils.keccak256(rlpEncoded)
  const contractAddress = `0x${contractAddressLong.substr(-40)}`

  return contractAddress
}

module.exports = {
  buildNonceForAddress,
  calculateNewProxyAddress,
}
