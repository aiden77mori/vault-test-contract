// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract TestToken is Ownable, ERC20Burnable {
    uint constant _tokenSupply = 1_500_000_000 * (10 ** 18);

    event Mint(address _to, uint256 _amount);

    constructor() ERC20("TestToken", "TT") {
        _mint(msg.sender, _tokenSupply);

        emit Mint(msg.sender, _tokenSupply);
    }
}
