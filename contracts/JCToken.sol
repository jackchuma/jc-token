// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract JCToken is ERC20, Ownable, VRFConsumerBase {

    uint private nonce = 0;
    mapping (address => uint) public addressLock;
    mapping (bytes32 => uint256) private randomRequests;
    uint private blockNumber;
    uint private blocksInYear;
    bytes32 internal keyHash;
    uint internal fee;
    uint public randomResult;

    constructor() ERC20("JC Token", "JCT") VRFConsumerBase(0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9, 0xa36085F69e2889c224210F603D836748e7dC0088) {
        _mint(_msgSender(), 10000 * 10 ** 18);
        blocksInYear = 365 * 1200 * 24;
        keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
        fee = 0.1 * 10 ** 18;
    }

    function getRandomNumber() public virtual returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
        return requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(bytes32 requestId, uint randomness) internal override {
        randomRequests[requestId] = randomness;
        randomResult = randomness;
    }

    function mint(address to, uint amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint amount) external {
        _burn(_msgSender(), amount);
    }

    function getRandom() internal virtual returns (uint) {
        return uint(keccak256(abi.encodePacked(_msgSender(), nonce, block.number))) % 1000;
    }

    function getBlocksInYear() internal virtual returns (uint) {
        return blocksInYear;
    }

    function luckyDouble() external {
        require(block.number > addressLock[_msgSender()], "Address is locked");
        nonce++;
        getRandomNumber();
        uint randNum = randomResult % 1000;
        addressLock[_msgSender()] = block.number + getBlocksInYear();
        uint bal = balanceOf(_msgSender());
        if (randNum > 900) {
            _mint(_msgSender(), bal);
            addressLock[_msgSender()] += getBlocksInYear();
        } else {
            _burn(_msgSender(), bal / 10);
        }
    }
}
