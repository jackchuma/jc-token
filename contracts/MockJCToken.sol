// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./JCToken.sol";

contract MockJCToken is JCToken {
    uint private mockRandomNum;
    uint private mockBlocksInYear;

    function setBlocksInYear(uint num) external {
        mockBlocksInYear = num;
    }

    function setRandom(uint _num) external {
        mockRandomNum = _num;
    }

    function getBlocksInYear() internal view override returns (uint) {
        return mockBlocksInYear;
    }

    function getRandom() internal view override returns (uint) {
        return mockRandomNum;
    }
}