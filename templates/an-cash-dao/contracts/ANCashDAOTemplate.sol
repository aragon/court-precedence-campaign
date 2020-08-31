/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;

import "./TokenCache.sol";
import "./BaseTemplate.sol";

import "./lib/os/ERC20.sol";


contract ANCashDAOTemplate is BaseTemplate, TokenCache {
    string constant private ERROR_MISSING_CACHE = "TEMPLATE_MISSING_TOKEN_CACHE";
    string constant private ERROR_EMPTY_HOLDERS = "EMPTY_HOLDERS";
    string constant private ERROR_BAD_HOLDERS_STAKES_LEN = "BAD_HOLDERS_STAKES_LEN";
    string constant private ERROR_BAD_VOTE_SETTINGS = "BAD_VOTE_SETTINGS";
    string constant private ERROR_BAD_COLLATERAL_REQUIREMENT_SETTINGS = "BAD_COL_REQ_SETTINGS";

    bool constant private SET_APP_FEES_CASHIER = false;
    bool constant private TOKEN_TRANSFERABLE = true;
    uint8 constant private TOKEN_DECIMALS = uint8(18);
    uint256 constant private TOKEN_MAX_PER_ACCOUNT = uint256(0);
    uint64 constant private DEFAULT_FINANCE_PERIOD = uint64(30 days);

    struct Cache {
        address dao;
        address token;
        address tokenManager;
        address agreement;
    }

    mapping (address => Cache) internal cache;

    constructor(DAOFactory _daoFactory, ENS _ens, MiniMeTokenFactory _miniMeFactory)
        BaseTemplate(_daoFactory, _ens, _miniMeFactory)
        public
    {}

    function createDAO(string _name, string _symbol, address[] _holders, uint256[] _stakes) external {
        (Kernel dao, ACL acl) = _createDAO();
        MiniMeToken token = _createToken(_name, _symbol, TOKEN_DECIMALS);

        TokenManager tokenManager = _installTokenManagerApp(dao, token, TOKEN_TRANSFERABLE, TOKEN_MAX_PER_ACCOUNT);
        _mintTokens(acl, tokenManager, _holders, _stakes);
        _storeCache(dao, token, tokenManager);
    }

    function installAgreement(string _title, bytes _content, address _arbitrator, address _stakingFactory) external {
        Kernel dao = _loadCache();
        Agreement agreement = _installAgreementApp(dao, _arbitrator, SET_APP_FEES_CASHIER, _title, _content, _stakingFactory);
        _storeCache(agreement);
    }

    function installApps(address _votesCreator, uint64[7] _votingSettings, uint256[4] _collateralRequirements) external {
        (Kernel dao, MiniMeToken token, TokenManager tokenManager, Agreement agreement) = _popCache();
        (Finance finance, DisputableVoting voting) = _setupApps(dao, agreement, token, tokenManager, _votingSettings, _collateralRequirements);

        ACL acl = ACL(dao.acl());
        acl.createPermission(_votesCreator, voting, voting.CREATE_VOTES_ROLE(), voting);

        _transferRootPermissionsFromTemplateAndFinalizeDAO(dao, voting, voting);
    }

    function _setupApps(
        Kernel _dao,
        Agreement _agreement,
        MiniMeToken _token,
        TokenManager _tokenManager,
        uint64[7] _votingSettings,
        uint256[4] _collateralRequirements
    )
        internal
        returns (Finance, DisputableVoting)
    {
        ACL acl = ACL(_dao.acl());
        Agent agent = _installAgentApp(_dao);
        Finance finance = _installFinanceApp(_dao, Vault(agent), DEFAULT_FINANCE_PERIOD);
        DisputableVoting voting = _installDisputableVotingApp(_dao, _token, _votingSettings);

        _setupPermissions(acl, agent, _agreement, voting, finance, _tokenManager);
        _activateDisputableVoting(acl, _agreement, voting, _collateralRequirements);
        return (finance, voting);
    }

    function _setupPermissions(
        ACL _acl,
        Agent _agent,
        Agreement _agreement,
        DisputableVoting _voting,
        Finance _finance,
        TokenManager _tokenManager
    )
        internal
    {
        _createAgentPermissions(_acl, _agent, _voting, _voting);
        _createVaultPermissions(_acl, Vault(_agent), _finance, _voting);
        _createAgreementPermissions(_acl, _agreement, _voting, _voting);
        _createFinancePermissions(_acl, _finance, _voting, _voting);
        _createEvmScriptsRegistryPermissions(_acl, _voting, _voting);
        _createDisputableVotingPermissions(_acl, _voting, _voting, _voting);
        _createTokenManagerPermissions(_acl, _tokenManager, _voting, _voting);
    }

    function _activateDisputableVoting(
        ACL _acl,
        Agreement _agreement,
        DisputableVoting _voting,
        uint256[4] _collateralRequirements
    )
        internal
    {
        ERC20 collateralToken = ERC20(_collateralRequirements[0]);
        uint64 challengeDuration = uint64(_collateralRequirements[1]);
        uint256 actionCollateral = _collateralRequirements[2];
        uint256 challengeCollateral = _collateralRequirements[3];

        _acl.createPermission(_agreement, _voting, _voting.SET_AGREEMENT_ROLE(), _voting);
        _agreement.activate(_voting, collateralToken, challengeDuration, actionCollateral, challengeCollateral);
        _transferPermissionFromTemplate(_acl, _agreement, _voting, _agreement.MANAGE_DISPUTABLE_ROLE(), _voting);
    }

    function _storeCache(Kernel _dao, MiniMeToken _token, TokenManager _tokenManager) internal {
        Cache storage c = cache[msg.sender];

        c.dao = address(_dao);
        c.token = address(_token);
        c.tokenManager = address(_tokenManager);
    }

    function _storeCache(Agreement _agreement) internal {
        Cache storage c = cache[msg.sender];
        c.agreement = address(_agreement);
    }

    function _loadCache() internal returns (Kernel) {
        Cache storage c = cache[msg.sender];
        require(c.dao != address(0), ERROR_MISSING_CACHE);
        return Kernel(c.dao);
    }

    function _popCache() internal returns (Kernel dao, MiniMeToken token, TokenManager tokenManager, Agreement agreement) {
        Cache storage c = cache[msg.sender];
        require(c.dao != address(0) && c.token != address(0) && c.tokenManager != address(0), ERROR_MISSING_CACHE);

        dao = Kernel(c.dao);
        token = MiniMeToken(c.token);
        tokenManager = TokenManager(c.tokenManager);
        agreement = Agreement(c.agreement);

        delete c.dao;
        delete c.token;
        delete c.tokenManager;
        delete c.agreement;
    }
}
