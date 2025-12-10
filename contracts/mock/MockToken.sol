pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

// ---------------------------------------------------------
// 1. Mock ERC20 Token (WETH, USDT)
// ---------------------------------------------------------
contract MockToken is ERC20, ERC20Permit {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) ERC20Permit(name)  {}

    // Публичный mint для тестов и для работы Router/Lending
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    // Публичный burn
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}