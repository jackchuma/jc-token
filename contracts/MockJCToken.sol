// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./JCToken.sol";

/*
 * Mock JCToken contract used for testing purposes to avoid having to make calls to Chainlink's Oracle service
*/

contract MockJCToken is JCToken {
    uint private mockRandomNum;
    uint private mockBlocksInYear;
    mapping (address => uint256) public mockAddressLock;

    function setBlocksInYear(uint num) external {
        mockBlocksInYear = num;
    }

    function setRandom(uint _num) external {
        mockRandomNum = _num;
    }

    function getBlocksInYear() internal view override returns (uint) {
        return mockBlocksInYear;
    }

    function getRandom() internal view returns (uint) {
        return mockRandomNum;
    }

    function luckyDouble() external override {
        require(block.number > mockAddressLock[_msgSender()], "Address is locked");
        uint randNum = mockRandomNum;
        mockAddressLock[_msgSender()] = block.number + getBlocksInYear();
        uint bal = balanceOf(_msgSender());
        if (randNum > 900) {
            _mint(_msgSender(), bal);
            addressLock[_msgSender()] += getBlocksInYear();
        } else {
            _burn(_msgSender(), bal / 10);
        }
    }
}