pragma solidity ^0.7.0;

interface ERC20 {
    function balanceOf(address _to) external view returns (uint256);
    function transfer(address _to, uint256 _amount) external returns (bool);
}

interface MiniMeToken {
    function balanceOfAt(address _holder, uint256 _blockNumber) external view returns (uint256);
}

interface Voting {
    enum VoterState { Absent, Yea, Nay }
    enum VoteStatus { Active, Paused, Cancelled, Executed }

    function token() external view returns (MiniMeToken);
    function getCastVote(uint256 _voteId, address _voter) external view returns (VoterState state, address caster);
    function getVote(uint256 _voteId) external view returns (uint256, uint256, uint256, uint256, uint256, VoteStatus, uint64, uint64, uint64, uint64, uint64, VoterState, bytes calldata);
}

contract TheLobbyGuy {
    string private constant ERROR_VOTE_WAS_NOT_EXECUTED = "TLG_VOTE_WAS_NOT_EXECUTED";
    string private constant ERROR_VOTER_DID_NOT_SUPPORT = "TLG_VOTER_DID_NOT_SUPPORT";
    string private constant ERROR_TOKEN_TRANSFER_FAILED = "TLG_TOKEN_TRANSFER_FAILED";
    string private constant ERROR_NO_BALANCE_TO_DISTRIBUTE = "TLG_NO_BALANCE_TO_DISTRIBUTE";

    Voting public voting;
    uint256 public voteId;

    constructor(Voting _voting, uint256 _voteId) public {
        voting = _voting;
        voteId = _voteId;
    }

    function withdraw(ERC20 _token) external {
        (uint256 yeas,,,,, Voting.VoteStatus status,, uint64 snapshotBlock,,,,,) = voting.getVote(voteId);
        require(status == Voting.VoteStatus.Executed, ERROR_VOTE_WAS_NOT_EXECUTED);

        uint256 currentBalance = _token.balanceOf(address(this));
        require(currentBalance > 0, ERROR_NO_BALANCE_TO_DISTRIBUTE);

        (Voting.VoterState state,) = voting.getCastVote(voteId, msg.sender);
        require(state == Voting.VoterState.Yea, ERROR_VOTER_DID_NOT_SUPPORT);

        MiniMeToken votingToken = voting.token();
        uint256 voterStake = votingToken.balanceOfAt(msg.sender, snapshotBlock);
        uint256 share = yeas / voterStake;
        require(_token.transfer(msg.sender, share), ERROR_TOKEN_TRANSFER_FAILED);
    }
}
