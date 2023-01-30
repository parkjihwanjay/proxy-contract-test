pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract TestV2 is Initializable {
    uint256 public x;
    uint256 public y;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        x = 3;
    }

    function setY() public {
        y = 4;
    }
}
