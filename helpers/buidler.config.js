const { task, usePlugin } = require('@nomiclabs/buidler/config')
const createDisputedVote = require('./lib/create-disputed-vote')

usePlugin('@nomiclabs/buidler-truffle5')
usePlugin("@nomiclabs/buidler-web3")

task('create-disputed-vote', 'Create disputed vote')
  .addParam('dispute', 'The path to the dispute dir to be created')
  .setAction(async ({ dispute }) => await createDisputedVote(dispute))

const ETH_KEYS = process.env.ETH_KEYS || process.env.ETH_KEY

module.exports = {
  networks: {
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
  },
}
