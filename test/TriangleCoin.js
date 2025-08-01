const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TriangleCoin (TRG)", function () {
  let triangleCoin;
  let owner;
  let addr1;
  let addr2;
  
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const TriangleCoin = await ethers.getContractFactory("TriangleCoin");
    triangleCoin = await TriangleCoin.deploy();
    await triangleCoin.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have correct name and symbol", async function () {
      expect(await triangleCoin.name()).to.equal("Triangle Coin");
      expect(await triangleCoin.symbol()).to.equal("TRG");
      expect(await triangleCoin.decimals()).to.equal(18);
    });

    it("Should mint initial supply of 4000 TRG to owner", async function () {
      const expectedSupply = ethers.parseEther("4000");
      expect(await triangleCoin.totalSupply()).to.equal(expectedSupply);
      expect(await triangleCoin.balanceOf(owner.address)).to.equal(expectedSupply);
    });

    it("Should set the right owner", async function () {
      expect(await triangleCoin.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(triangleCoin.mint(addr1.address, mintAmount))
        .to.emit(triangleCoin, "TokensMinted")
        .withArgs(addr1.address, mintAmount);
      
      expect(await triangleCoin.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await triangleCoin.totalSupply()).to.equal(ethers.parseEther("5000"));
    });

    it("Should not allow non-owner to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(
        triangleCoin.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(triangleCoin, "OwnableUnauthorizedAccount");
    });

    it("Should not allow minting to zero address", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      await expect(
        triangleCoin.mint(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWith("Cannot mint to zero address");
    });
  });

  describe("Burning", function () {
    it("Should allow owner to burn own tokens", async function () {
      const burnAmount = ethers.parseEther("1000");
      
      await expect(triangleCoin.burn(burnAmount))
        .to.emit(triangleCoin, "TokensBurned")
        .withArgs(owner.address, burnAmount);
      
      expect(await triangleCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("3000"));
      expect(await triangleCoin.totalSupply()).to.equal(ethers.parseEther("3000"));
    });

    it("Should allow owner to burn from any address", async function () {
      await triangleCoin.mint(addr1.address, ethers.parseEther("500"));
      
      const burnAmount = ethers.parseEther("200");
      
      await expect(triangleCoin.burnFrom(addr1.address, burnAmount))
        .to.emit(triangleCoin, "TokensBurned")
        .withArgs(addr1.address, burnAmount);
      
      expect(await triangleCoin.balanceOf(addr1.address)).to.equal(ethers.parseEther("300"));
    });
  });

  describe("Helper Functions", function () {
    it("Should convert tokens to wei correctly", async function () {
      expect(await triangleCoin.toTokens(100)).to.equal(ethers.parseEther("100"));
    });

    it("Should convert wei to tokens correctly", async function () {
      expect(await triangleCoin.fromWei(ethers.parseEther("100"))).to.equal(100);
    });

    it("Should return correct token info", async function () {
      const [name, symbol, decimals, totalSupply] = await triangleCoin.getTokenInfo();
      expect(name).to.equal("Triangle Coin");
      expect(symbol).to.equal("TRG");
      expect(decimals).to.equal(18);
      expect(totalSupply).to.equal(ethers.parseEther("4000"));
    });
  });

  describe("ERC20 Functions", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("500");
      
      await triangleCoin.transfer(addr1.address, transferAmount);
      expect(await triangleCoin.balanceOf(addr1.address)).to.equal(transferAmount);
      expect(await triangleCoin.balanceOf(owner.address)).to.equal(ethers.parseEther("3500"));
    });
  });
});
