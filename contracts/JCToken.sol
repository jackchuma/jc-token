// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract JCToken is ERC20, Ownable, VRFConsumerBase {

    uint256 private nonce = 0;
    mapping (address => uint256) public addressLock;
    mapping (bytes32 => uint256) private randomRequests;
    uint256 private blockNumber;
    uint256 private blocksInYear = 365 * 1200 * 24;
    bytes32 internal keyHash;
    uint256 internal fee = 0.1 * 10 ** 18;
    uint256 public randomResult;

    constructor() ERC20("JC Token", "JCT") VRFConsumerBase(0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9, 0xa36085F69e2889c224210F603D836748e7dC0088) {
        _mint(_msgSender(), 10000 * 10 ** 18);
        keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
    }

    /**
     * @notice Calls into VRFConsumerBase to request a random number from Chainlink's Oracle service
     * @dev Makes sure contract is funded with enough LINK to pay Chainlink's fee, then makes Oracle call
     * @return requestId ID of random number request
    */
    function getRandomNumber() private returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
        return requestRandomness(keyHash, fee);
    }

    /**
     * @notice Callback function that gets called from Chainlink Oracle after random number is generated
     * @dev Saves random number in mapping and state variable
     * @param requestId ID of random number request
     * @param randomness Generated random number
    */
    function fulfillRandomness(bytes32 requestId, uint randomness) internal override {
        randomRequests[requestId] = randomness;
        randomResult = randomness;
    }

    /**
     * @notice To be called by the owner of this contract when minting is desired
     * @dev Mints a set amount of tokens to a specific address
     * @param to Address of recipient
     * @param amount Amount of tokens to mint
    */
    function mint(address to, uint amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice To be called by anyone that wants to burn a certain amount of tokens
     * @param amount Amount of tokens to burn
    */
    // TODO: Make sure amount is not higher than balance
    function burn(uint amount) external {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Getter function that returns the number of blocks in a year
    */
    function getBlocksInYear() internal virtual returns (uint) {
        return blocksInYear;
    }

    /**
     * @notice To be called from anyone that would like to take a chance to double their token balance
     * @dev Using an random number, provides a 10% chance that msg.sender's account balance will double
     * @dev 90% chance they will lose 10% of their account balance
     * @dev Can only be called once per year at the most. 2 year block if someone's account balance doubles
    */
    function luckyDouble() external virtual {
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
