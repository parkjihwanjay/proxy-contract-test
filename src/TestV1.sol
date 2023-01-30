pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract TestV1 is Initializable {
    uint256 public x;
    event SetUp();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        x = 3;
        emit SetUp();
    }
}
