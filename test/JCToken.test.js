const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { advanceBlockBy } = require("./utils.js");

describe("JC Token", function() {
  beforeEach(async function() {
    [this.owner, this.alice, this.bob] = await ethers.getSigners();
    const JCToken = await ethers.getContractFactory("JCToken");
    this.token = await JCToken.deploy();
    await this.token.deployed();
  });

  context("Deployment", async function() {
    it ("should have proper name after deployment", async function () {
      expect(await this.token.name()).to.equal("JC Token");
    });

    it ("should have proper symbol after deployment", async function() {
      expect(await this.token.symbol()).to.equal("JCT");
    });

    it ("deployment should assign total supply of tokens to this.owner", async function() {
      const ownerBalance = await this.token.balanceOf(this.owner.address);
      expect(await this.token.totalSupply()).to.equal(ownerBalance);
    });
  });

  context("mint()", async function() {
    it ("owner should be able to mint tokens to someone else", async function() {
      const totalSupply = await this.token.totalSupply();
      await this.token.mint(this.alice.address, 10000);
      expect(await this.token.balanceOf(this.alice.address)).to.equal(10000);
      expect(BigNumber.from(await this.token.totalSupply())).to.equal(BigNumber.from(totalSupply).add(10000))
    });

    it ("only owner can mint tokens", async function() {
      await expect(this.token.connect(this.alice).mint(this.bob.address, 50)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  context("burn()", async function() {
    it ("anyone can burn tokens", async function() {
      const totalSupply = await this.token.totalSupply();
      await this.token.mint(this.alice.address, 50);
      expect(await this.token.balanceOf(this.alice.address)).to.equal(50);
      await this.token.connect(this.alice).burn(50);
      expect(await this.token.balanceOf(this.alice.address)).to.equal(0);
      expect(await this.token.totalSupply()).to.equal(totalSupply);
    });
  });

  context("luckyDouble()", async function() {
    beforeEach(async function() {
      const MockJCToken = await ethers.getContractFactory("MockJCToken");
      this.mockToken = await MockJCToken.deploy();
    });

    it ("luckyDouble() can only be called once per year", async function() {
      await this.mockToken.setRandom(500);
      await this.mockToken.setBlocksInYear(10);
      await this.token.mint(this.alice.address, 50);
      await this.mockToken.connect(this.alice).luckyDouble();
      await expect(this.mockToken.connect(this.alice).luckyDouble()).to.be.revertedWith("Address is locked");
    });

    it ("check behavior based on random number", async function() {
      await this.mockToken.setRandom(901);
      await this.mockToken.mint(this.alice.address, 50);
      await this.mockToken.connect(this.alice).luckyDouble();
      expect(await this.mockToken.balanceOf(this.alice.address)).to.equal(100);
  
      await this.mockToken.setRandom(900);
      await this.mockToken.mint(this.bob.address, 50);
      await this.mockToken.connect(this.bob).luckyDouble();
      expect(await this.mockToken.balanceOf(this.bob.address)).to.equal(45);
    });

    it ("luckyDouble() can be called again after 1 or 2 years", async function() {
      await this.mockToken.setBlocksInYear(10);
      await this.mockToken.setRandom(900);
      await this.mockToken.mint(this.alice.address, 50);
      await this.mockToken.connect(this.alice).luckyDouble();
      await expect(this.mockToken.connect(this.alice).luckyDouble()).to.be.revertedWith("Address is locked");
  
      await advanceBlockBy(11);
      expect(await this.mockToken.connect(this.alice).luckyDouble());
  
      await this.mockToken.setRandom(901);
      await this.mockToken.mint(this.bob.address, 50);
      await this.mockToken.connect(this.bob).luckyDouble();
      await expect(this.mockToken.connect(this.bob).luckyDouble()).to.be.revertedWith("Address is locked");
  
      await advanceBlockBy(21);
      expect(await this.mockToken.connect(this.bob).luckyDouble());
    });
  });
});
