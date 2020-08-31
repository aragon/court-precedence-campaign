The proposal Justification says:

> This proposal will initialize the Execute actions permission on the Agent app, assign the Manager role to the Voting app, and assign the permission itself to the Tokens app.

However the blockchain data shows:

> ACL: Create a new permission granting `0x9958466922867D4fc0Da7451c9E717e4ff92D6fE` the ability to perform actions of role "Execute actions" on "Agent" (setting "Voting" as the permission manager)

`0x9958466922867D4fc0Da7451c9E717e4ff92D6fE` is NOT the address of the Tokens app. It is the address of the token contract that is controlled by the Tokens app.

Given guideline 3.2 of the Aragon Network Cash Agreement:

> Proposals MUST be accompanied by an accurate American English-language Justification of the proposal.

Proposed ruling: BLOCK
