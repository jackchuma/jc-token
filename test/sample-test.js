const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { advanceBlockBy } = require("./utils.js");

describe("JC Token", () => {

  let alice, bob;
  let JCToken;
  let token;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    JCToken = await ethers.getContractFactory("JCToken");
    token = await JCToken.deploy();
  })

  it("should have proper name after deployment", async function () {
    expect(await token.name()).to.equal("JC Token");
  })

  it("should have proper symbol after deployment", async () => {
    expect(await token.symbol()).to.equal("JCT");
  })

  it("deployment should assign total supply of tokens to owner", async () => {
    const ownerBalance = await token.balanceOf(owner.address);

    expect(await token.totalSupply()).to.equal(ownerBalance);
  })

  it("owner should be able to mint tokens to someone else", async () => {
    const totalSupply = await token.totalSupply();

    await token.mint(alice.address, 10000);

    expect(await token.balanceOf(alice.address)).to.equal(10000);
    expect(BigNumber.from(await token.totalSupply())).to.equal(BigNumber.from(totalSupply).add(10000))
  })

  it("only owner can mint tokens", async () => {
    await expect(token.connect(alice).mint(bob.address, 50)).to.be.revertedWith("Ownable: caller is not the owner");
  })

  it("should transfer tokens between accounts", async() => {
    //Transfer 50 tokens from owner to alice
    await token.transfer(alice.address, 50);

    expect(await token.balanceOf(alice.address)).to.equal(50);
    expect(await token.balanceOf(bob.address)).to.equal(0);

    await token.connect(alice).transfer(bob.address, 25);

    expect(await token.balanceOf(alice.address)).to.equal(25);
    expect(await token.balanceOf(bob.address)).to.equal(25);
  })

  it("anyone can burn tokens", async () => {
    const totalSupply = await token.totalSupply();
    //Mint 50 tokens to alice
    await token.mint(alice.address, 50);

    expect(await token.balanceOf(alice.address)).to.equal(50);

    //Alice decides to burn all 50 of her tokens
    await token.connect(alice).burn(50);

    expect(await token.balanceOf(alice.address)).to.equal(0);
    expect(await token.totalSupply()).to.equal(totalSupply);
  })

  it("should fail if sender doesn't have enough tokens", async () => {
    await expect(token.connect(alice).transfer(bob.address, 50)).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  })

  it("luckyDouble() can only be called once per year", async () => {
    await token.mint(alice.address, 50);
    await token.connect(alice).luckyDouble();
    await expect(token.connect(alice).luckyDouble()).to.be.revertedWith("Address is locked");
  })

  it("check behavior based on random number", async () => {
    const MockJCToken = await ethers.getContractFactory("MockJCToken");
    const mockToken = await MockJCToken.deploy();

    await mockToken.setRandom(901);
    await mockToken.mint(alice.address, 50);
    await mockToken.connect(alice).luckyDouble();
    expect(await mockToken.balanceOf(alice.address)).to.equal(100);

    await mockToken.setRandom(900);
    await mockToken.mint(bob.address, 50);
    await mockToken.connect(bob).luckyDouble();
    expect(await mockToken.balanceOf(bob.address)).to.equal(45);
  })

  it("luckyDouble() can be called again after 1 or 2 years", async () => {
    const MockJCToken = await ethers.getContractFactory("MockJCToken");
    const mockToken = await MockJCToken.deploy();

    await mockToken.setBlocksInYear(10);
    await mockToken.setRandom(900);
    await mockToken.mint(alice.address, 50);
    await mockToken.connect(alice).luckyDouble();
    await expect(mockToken.connect(alice).luckyDouble()).to.be.revertedWith("Address is locked");

    await advanceBlockBy(11);
    expect(await mockToken.connect(alice).luckyDouble());

    await mockToken.setRandom(901);
    await mockToken.mint(bob.address, 50);
    await mockToken.connect(bob).luckyDouble();
    await expect(mockToken.connect(bob).luckyDouble()).to.be.revertedWith("Address is locked");

    await advanceBlockBy(21);
    expect(await mockToken.connect(bob).luckyDouble());
  })
})
