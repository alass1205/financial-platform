const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShareToken (CLV/ROO)", function () {
  let triangleCoin;
  let clvToken;
  let rooToken;
  let owner;
  let addr1;
  let addr2;
  
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Déployer TRG d'abord
    const TriangleCoin = await ethers.getContractFactory("TriangleCoin");
    triangleCoin = await TriangleCoin.deploy();
    await triangleCoin.waitForDeployment();
    
    // Déployer CLV (100 shares)
    const ShareToken = await ethers.getContractFactory("ShareToken");
    clvToken = await ShareToken.deploy(
      "Clove Company",
      "CLV", 
      100,
      await triangleCoin.getAddress()
    );
    await clvToken.waitForDeployment();
    
    // Déployer ROO (100 shares)
    rooToken = await ShareToken.deploy(
      "Rooibos Limited",
      "ROO",
      100,
      await triangleCoin.getAddress()
    );
    await rooToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy CLV with correct parameters", async function () {
      expect(await clvToken.name()).to.equal("Clove Company");
      expect(await clvToken.symbol()).to.equal("CLV");
      expect(await clvToken.totalSupply()).to.equal(ethers.parseEther("100"));
      expect(await clvToken.balanceOf(owner.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should deploy ROO with correct parameters", async function () {
      expect(await rooToken.name()).to.equal("Rooibos Limited");
      expect(await rooToken.symbol()).to.equal("ROO");
      expect(await rooToken.totalSupply()).to.equal(ethers.parseEther("100"));
      expect(await rooToken.balanceOf(owner.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should set correct dividend token", async function () {
      expect(await clvToken.dividendToken()).to.equal(await triangleCoin.getAddress());
      expect(await rooToken.dividendToken()).to.equal(await triangleCoin.getAddress());
    });
  });

  describe("Share Transfers", function () {
    it("Should transfer CLV shares correctly", async function () {
      const transferAmount = ethers.parseEther("10");
      
      await clvToken.transfer(addr1.address, transferAmount);
      
      expect(await clvToken.balanceOf(addr1.address)).to.equal(transferAmount);
      expect(await clvToken.balanceOf(owner.address)).to.equal(ethers.parseEther("90"));
    });

    it("Should transfer ROO shares correctly", async function () {
      const transferAmount = ethers.parseEther("20");
      
      await rooToken.transfer(addr1.address, transferAmount);
      
      expect(await rooToken.balanceOf(addr1.address)).to.equal(transferAmount);
      expect(await rooToken.balanceOf(owner.address)).to.equal(ethers.parseEther("80"));
    });
  });

  describe("Dividend Distribution", function () {
    beforeEach(async function () {
      // Distribuer quelques actions pour les tests
      await clvToken.transfer(addr1.address, ethers.parseEther("10")); // 10 CLV à addr1
      await clvToken.transfer(addr2.address, ethers.parseEther("20")); // 20 CLV à addr2
      // Owner garde 70 CLV
    });

    it("Should distribute dividends correctly", async function () {
      const dividendAmount = ethers.parseEther("100"); // 100 TRG
      
      // Approuver le contrat CLV à dépenser les TRG du owner
      await triangleCoin.approve(await clvToken.getAddress(), dividendAmount);
      
      await expect(clvToken.distributeDividends(dividendAmount))
        .to.emit(clvToken, "DividendsDistributed");
      
      expect(await clvToken.totalDividendsDistributed()).to.equal(dividendAmount);
    });

    it("Should calculate available dividends correctly", async function () {
      const dividendAmount = ethers.parseEther("100"); // 100 TRG pour 100 CLV = 1 TRG par CLV
      
      await triangleCoin.approve(await clvToken.getAddress(), dividendAmount);
      await clvToken.distributeDividends(dividendAmount);
      
      // addr1 a 10 CLV, donc doit recevoir 10 TRG
      expect(await clvToken.availableDividends(addr1.address)).to.equal(ethers.parseEther("10"));
      
      // addr2 a 20 CLV, donc doit recevoir 20 TRG  
      expect(await clvToken.availableDividends(addr2.address)).to.equal(ethers.parseEther("20"));
      
      // owner a 70 CLV, donc doit recevoir 70 TRG
      expect(await clvToken.availableDividends(owner.address)).to.equal(ethers.parseEther("70"));
    });

    it("Should allow claiming dividends", async function () {
      const dividendAmount = ethers.parseEther("100");
      
      await triangleCoin.approve(await clvToken.getAddress(), dividendAmount);
      await clvToken.distributeDividends(dividendAmount);
      
      const initialBalance = await triangleCoin.balanceOf(addr1.address);
      
      await expect(clvToken.connect(addr1).claimDividends())
        .to.emit(clvToken, "DividendClaimed")
        .withArgs(addr1.address, ethers.parseEther("10"));
      
      const finalBalance = await triangleCoin.balanceOf(addr1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("10"));
    });

    it("Should not allow claiming dividends twice", async function () {
      const dividendAmount = ethers.parseEther("100");
      
      await triangleCoin.approve(await clvToken.getAddress(), dividendAmount);
      await clvToken.distributeDividends(dividendAmount);
      
      // Première réclamation
      await clvToken.connect(addr1).claimDividends();
      
      // Deuxième réclamation (doit échouer)
      await expect(
        clvToken.connect(addr1).claimDividends()
      ).to.be.revertedWith("No dividends to claim");
    });
  });

  describe("Share Info", function () {
    it("Should return correct share info for CLV", async function () {
      const [name, symbol, supply, dividends, tokenAddr] = await clvToken.getShareInfo();
      
      expect(name).to.equal("Clove Company");
      expect(symbol).to.equal("CLV");
      expect(supply).to.equal(ethers.parseEther("100"));
      expect(dividends).to.equal(0); // Pas encore de dividendes
      expect(tokenAddr).to.equal(await triangleCoin.getAddress());
    });

    it("Should return correct share info for ROO", async function () {
      const [name, symbol, supply, dividends, tokenAddr] = await rooToken.getShareInfo();
      
      expect(name).to.equal("Rooibos Limited");
      expect(symbol).to.equal("ROO");
      expect(supply).to.equal(ethers.parseEther("100"));
      expect(dividends).to.equal(0);
      expect(tokenAddr).to.equal(await triangleCoin.getAddress());
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to distribute dividends", async function () {
      const dividendAmount = ethers.parseEther("100");
      
      await expect(
        clvToken.connect(addr1).distributeDividends(dividendAmount)
      ).to.be.revertedWithCustomError(clvToken, "OwnableUnauthorizedAccount");
    });

    it("Should not allow distributing zero dividends", async function () {
      await expect(
        clvToken.distributeDividends(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });
});
