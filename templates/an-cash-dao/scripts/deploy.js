const { utf8ToHex } = require('web3-utils')
const { pct16, bn, getEventArgument, ONE_DAY } = require('@aragon/contract-helpers-test')

const DEFAULTS = {
  token: {
    name: 'AN Cash DAO Token',
    symbol: 'ANCDT',
    holders: ['0x0090aED150056316E37FE6DFa10Dc63E79D173B6'],
    stakes: [1]
  },
  agreement: {
    title:        'Aragon Network Cash Agreement',
    content:      utf8ToHex('ipfs:QmPvfWUNt3WrZ7uaB1ZwEmec3Zr1ABL9CncSDfQypWkmnp'),
  },
  disputableVoting: {
    duration:               ONE_DAY * 5,
    support:                pct16(50),
    minQuorum:              pct16(50),
    executionDelay:         0,
    delegatedVotingPeriod:  ONE_DAY * 2,
    quietEndingPeriod:      ONE_DAY,
    quietEndingExtension:   ONE_DAY / 2,
    actionCollateral:       bn(0),
    challengeCollateral:    bn(0),
    challengeDuration:      ONE_DAY * 3,
  },
}

const CONFIG = {
  rinkeby: {
    ...DEFAULTS,
    ens:            '0x98Df287B6C145399Aaa709692c8D308357bC085D',
    daoFactory:     '0x89d87269527495ac29648376d4154ba55c4872fc',
    miniMeFactory:  '0x6ffeb4038f7f077c4d20eaf1706980caec31e2bf',
    arbitrator:     '0x52180af656a1923024d1accf1d827ab85ce48878',   // Aragon Court staging instance
    stakingFactory: '0x07429001eeA415E967C57B8d43484233d57F8b0B',   // Real StakingFactory instance on Rinkeby
    feeToken:       '0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42',   // DAI mock token used in Aragon Court staging
    template:       '0x3F80C9CAC0D619202c7f34B5Afa36f2300972af2'    // AN cash DAO template on Rinkeby
  },
  mainnet: {
    ...DEFAULTS,
    ens:            '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    daoFactory:     '',
    miniMeFactory:  '',
    arbitrator:     '0xee4650cBe7a2B23701D416f58b41D8B76b617797',   // Aragon Court
    stakingFactory: '',
    feeToken:       '0x6b175474e89094c44da98b954eedeac495271d0f',   // DAI v2
  }
}

module.exports = async function deploy(network) {
  const config = CONFIG[network]
  const { ens, daoFactory, miniMeFactory } = config

  const Template = artifacts.require('ANCashDAOTemplate')
  const template = config.template
    ? (await Template.at(config.template))
    : (await Template.new(daoFactory, ens, miniMeFactory))

  console.log(`Creating DAO with template ${template.address}...`)
  const { token: { name, symbol, holders, stakes } } = config

  const DAOFactory = artifacts.require('DAOFactory')
  const receipt = await template.createDAO(name, symbol, holders, stakes)
  const dao = getEventArgument(receipt, 'DeployDAO', 'dao', { decodeForAbi: DAOFactory.abi })
  console.log(`DAO created at ${dao}`)

  console.log('Installing agreement...')
  const { agreement: { title, content }, arbitrator, stakingFactory } = config
  await template.installAgreement(title, content, arbitrator, stakingFactory)

  console.log('Installing apps...')
  const { disputableVoting: { duration, support, minQuorum, delegatedVotingPeriod, quietEndingPeriod, quietEndingExtension, executionDelay } } = config
  const { feeToken, disputableVoting: { actionCollateral, challengeCollateral, challengeDuration } } = config
  await template.installApps(
    holders[0],
    [duration, support, minQuorum, delegatedVotingPeriod, quietEndingPeriod, quietEndingExtension, executionDelay],
    [feeToken, challengeDuration, actionCollateral, challengeCollateral],
  )

  console.log(`\nDAO ${dao} set up successfully!`)
}
