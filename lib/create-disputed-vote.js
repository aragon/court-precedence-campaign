const fs = require('fs')
const { utf8ToHex } = require('web3-utils')
const { bn, getEventArgument } = require('@aragon/contract-helpers-test')

module.exports = async function createDisputedVote(disputePath) {
  const { agreement, voting, script, submitter, challenger } = await loadDisputeConfig(disputePath)

  await signAgreementIfNecessary(agreement, submitter.address)
  const actionId = await newAction(agreement, voting, script, submitter)
  const { arbitrator, feeToken, feeAmount } = await fetchArbitratorInfo(agreement, actionId)
  await challenge(agreement, actionId, arbitrator, feeToken, feeAmount, challenger)
  await dispute(agreement, actionId, arbitrator, feeToken, feeAmount, submitter)
}

async function newAction(agreement, voting, script, submitter) {
  console.log('\nCreating vote action...')
  const receipt = await voting.newVote(script, utf8ToHex(submitter.context), { from: submitter.address })
  const actionId = getEventArgument(receipt, 'ActionSubmitted', 'actionId', { decodeForAbi: agreement.abi })
  console.log(`Created vote with action ID ${actionId}!`)
  return actionId
}

async function challenge(agreement, actionId, arbitrator, feeToken, feeAmount, challenger) {
  console.log('\nApproving dispute fees from challenger...')
  await approveFeeToken(feeToken, challenger.address, agreement.address, feeAmount)
  console.log('\bChallenging vote action...')
  await agreement.challengeAction(actionId, 0, true, utf8ToHex(challenger.context), { from: challenger.address })
  console.log(`Challenged vote with action ID ${actionId}!`)
}

async function dispute(agreement, actionId, arbitrator, feeToken, feeAmount, submitter) {
  console.log('\nApproving dispute fees from submitter...')
  await approveFeeToken(feeToken, submitter.address, agreement.address, feeAmount)
  console.log(`\nDisputing vote...`)
  await agreement.disputeAction(actionId, true, { from: submitter.address })
  console.log(`Disputed vote with action ID ${actionId}!`)
}

async function fetchArbitratorInfo(agreement, actionId) {
  console.log('\nFetching action arbitrator...')
  const { settingId } = await agreement.getAction(actionId)
  const { arbitrator: arbitratorAddress } = await agreement.getSetting(settingId)
  const arbitrator = await getInstance('IArbitrator', arbitratorAddress)

  console.log('\nFetching arbitrator dispute fees info...')
  const { feeToken: feeTokenAddress, feeAmount } = await arbitrator.getDisputeFees()
  const feeToken = await getInstance('ERC20', feeTokenAddress)
  return { arbitrator, feeToken, feeAmount }
}

async function signAgreementIfNecessary(agreement, signer) {
  const { mustSign } = await agreement.getSigner(signer)
  if (mustSign) {
    console.log(`\nSigning the agreement for ${signer}...`)
    const currentSettingId = await agreement.getCurrentSettingId()
    await agreement.sign(currentSettingId, { from: signer })
    console.log('Agreement signed!')
  }
}

async function approveFeeToken(token, from, to, amount) {
  const allowance = await token.allowance(from, to)
  if (allowance.gt(bn(0))) await token.approve(to, 0, { from })
  const newAllowance = amount.add(allowance)
  return token.approve(to, newAllowance, { from })
}

async function loadDisputeConfig(disputePath) {
  const path = require('path').join(process.cwd(), disputePath)

  if (!fs.existsSync(path)) throw Error(`Dispute dir path "${path}" does not exit`)
  if (!fs.existsSync(`${path}/script.js`)) throw Error('Dispute tx script does not exit')
  if (!fs.existsSync(`${path}/metadata.json`)) throw Error('Dispute metadata does not exit')

  const { voting: votingAddress, submitterJustification, challengerJustification } = require(`${path}/metadata.json`)
  if (!votingAddress) throw Error('Dispute metadata does not specify a voting address')
  if (!submitterJustification) throw Error('Dispute metadata does not specify a justification for the submitter')
  if (!challengerJustification) throw Error('Dispute metadata does not specify a justification for the challenger')

  const parties = await getPartiesAddress()
  const submitter = { address: parties.submitter, context: submitterJustification }
  const challenger = { address: parties.challenger, context: challengerJustification }

  const voting = await getInstance('DisputableVoting', votingAddress)
  const agreement = await getInstance('Agreement', await voting.getAgreement())

  const script = await require(`${path}/script`)()
  if (!script) throw Error('Tx script is not valid, must at least be an empty call script')

  return { voting, agreement, script, submitter, challenger }
}

async function getPartiesAddress() {
  const accounts = await web3.eth.getAccounts()
  if (accounts.length < 2) throw Error('You need two private keys set tup to create disputed votes: submitter [0] and challenger [1]')
  return { submitter: accounts[0], challenger: accounts[1] }
}

async function getInstance(contract, address) {
  return artifacts.require(contract).at(address)
}
