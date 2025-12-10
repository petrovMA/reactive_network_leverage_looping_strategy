pragma solidity ^0.8.20;

import "./MockToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ---------------------------------------------------------
// 2. Mock Router (DEX + Oracle)
// ---------------------------------------------------------
contract MockRouter is Ownable {
    // Цены активов в USD (с 8 знаками точности, как Chainlink, или просто raw value).
    // Для простоты: 1 WETH = 3000, 1 USDT = 1.
    // Храним price * 1e18 для точности при делении.
    mapping(address => uint256) public prices;

    constructor() Ownable(msg.sender) {}

    // Установка цены владельцем (для симуляции движения рынка)
    // price example: WETH = 3000 * 10**18, USDT = 1 * 10**18
    function setPrice(address token, uint256 price) external onlyOwner {
        prices[token] = price;
    }

    // Симуляция Uniswap V2: swapExactTokensForTokens
    // Сжигает входной токен у юзера, минтит выходной токен юзеру.
    // Игнорируем path (кроме [0] и [last]) и deadline.
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 /* deadline */
    ) external returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];

        uint256 priceIn = prices[tokenIn];
        uint256 priceOut = prices[tokenOut];
        require(priceIn > 0 && priceOut > 0, "Price not set");

        // Математика обмена: (AmountIn * PriceIn) / PriceOut
        // Так как decimals везде 18, дополнительная нормализация не нужна
        uint256 amountOut = (amountIn * priceIn) / priceOut;

        require(amountOut >= amountOutMin, "Slippage error");

        // Сжигаем входные (юзер должен был сделать approve)
        MockToken(tokenIn).burn(msg.sender, amountIn);

        // Минтим выходные
        MockToken(tokenOut).mint(to, amountOut);

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;

        return amounts;
    }
}
