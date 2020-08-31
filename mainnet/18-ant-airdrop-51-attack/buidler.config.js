const { usePlugin } = require('@nomiclabs/buidler/config')

usePlugin("@nomiclabs/buidler-ganache")
usePlugin('@nomiclabs/buidler-truffle5')
usePlugin("@nomiclabs/buidler-etherscan")

const ETH_KEYS = process.env.ETH_KEYS || process.env.ETH_KEY

module.exports = {
  networks: {
    ganache: {
      url: 'http://localhost:8545',
      gasLimit: 6000000000,
      defaultBalanceEther: 100
    },
    mainnet: {
      url: 'https://mainnet.eth.aragon.network',
      accounts: ETH_KEYS ? ETH_KEYS.split(',') : [
        '0xa8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563',
      ],
    },
    rinkeby: {
      url: 'https://rinkeby.eth.aragon.network',
      accounts: ETH_KEYS ? ETH_KEYS.split(',') : [
        '0xa8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563',
      ],
    },
    frame: {
      httpHeaders: { origin: 'buidler' },
      url: 'http://localhost:1248',
    }
  },
  solc: {
    version: '0.7.0',
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: "YOUR_ETHERSCAN_API_KEY"
  },
}
