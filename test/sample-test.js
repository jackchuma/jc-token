const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { advanceBlockBy } = require("./utils.js");

describe("JC Token", () => {
  beforeEach(async () => {
    [this.owner, this.alice, this.bob] = await ethers.getSigners();
    this.JCToken = await ethers.getContractFactory("JCToken");
    this.token = await this.JCToken.deploy();
  })

  it("should have proper name after deployment", async function () {
    expect(await this.token.name()).to.equal("JC Token");
  })

  it("should have proper symbol after deployment", async () => {
    expect(await this.token.symbol()).to.equal("JCT");
  })

  it("deployment should assign total supply of tokens to this.owner", async () => {
    const ownerBalance = await this.token.balanceOf(this.owner.address);

    expect(await this.token.totalSupply()).to.equal(ownerBalance);
  })

  it("this.owner should be able to mint tokens to someone else", async () => {
    const totalSupply = await this.token.totalSupply();

    await this.token.mint(this.alice.address, 10000);

    expect(await this.token.balanceOf(this.alice.address)).to.equal(10000);
    expect(BigNumber.from(await this.token.totalSupply())).to.equal(BigNumber.from(totalSupply).add(10000))
  })

  it("only this.owner can mint tokens", async () => {
    await expect(this.token.connect(this.alice).mint(this.bob.address, 50)).to.be.revertedWith("Ownable: caller is not the this.owner");
  })

  it("should transfer tokens between accounts", async() => {
    //Transfer 50 tokens from this.owner to this.alice
    await this.token.transfer(this.alice.address, 50);

    expect(await this.token.balanceOf(this.alice.address)).to.equal(50);
    expect(await this.token.balanceOf(this.bob.address)).to.equal(0);

    await this.token.connect(this.alice).transfer(this.bob.address, 25);

    expect(await this.token.balanceOf(this.alice.address)).to.equal(25);
    expect(await this.token.balanceOf(this.bob.address)).to.equal(25);
  })

  it("anyone can burn tokens", async () => {
    const totalSupply = await this.token.totalSupply();
    //Mint 50 tokens to this.alice
    await this.token.mint(this.alice.address, 50);

    expect(await this.token.balanceOf(this.alice.address)).to.equal(50);

    //Alice decides to burn all 50 of her tokens
    await this.token.connect(this.alice).burn(50);

    expect(await this.token.balanceOf(this.alice.address)).to.equal(0);
    expect(await this.token.totalSupply()).to.equal(totalSupply);
  })

  it("should fail if sender doesn't have enough tokens", async () => {
    await expect(this.token.connect(this.alice).transfer(this.bob.address, 50)).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  })

  it("luckyDouble() can only be called once per year", async () => {
    await this.token.mint(this.alice.address, 50);
    await this.token.connect(this.alice).luckyDouble();
    await expect(this.token.connect(this.alice).luckyDouble()).to.be.revertedWith("Address is locked");
  })

  it ("check behavior based on random number", async () => {
    const MockJCToken = await ethers.getContractFactory("MockJCToken");
    const mockToken = await MockJCToken.deploy();

    await mockToken.setRandom(901);
    await mockToken.mint(this.alice.address, 50);
    await mockToken.connect(this.alice).luckyDouble();
    expect(await mockToken.balanceOf(this.alice.address)).to.equal(100);

    await mockToken.setRandom(900);
    await mockToken.mint(this.bob.address, 50);
    await mockToken.connect(this.bob).luckyDouble();
    expect(await mockToken.balanceOf(this.bob.address)).to.equal(45);
  })

  it("luckyDouble() can be called again after 1 or 2 years", async () => {
    const MockJCToken = await ethers.getContractFactory("MockJCToken");
    const mockToken = await MockJCToken.deploy();

    await mockToken.setBlocksInYear(10);
    await mockToken.setRandom(900);
    await mockToken.mint(this.alice.address, 50);
    await mockToken.connect(this.alice).luckyDouble();
    await expect(mockToken.connect(this.alice).luckyDouble()).to.be.revertedWith("Address is locked");

    await advanceBlockBy(11);
    expect(await mockToken.connect(this.alice).luckyDouble());

    await mockToken.setRandom(901);
    await mockToken.mint(this.bob.address, 50);
    await mockToken.connect(this.bob).luckyDouble();
    await expect(mockToken.connect(this.bob).luckyDouble()).to.be.revertedWith("Address is locked");

    await advanceBlockBy(21);
    expect(await mockToken.connect(this.bob).luckyDouble());
  })
})
