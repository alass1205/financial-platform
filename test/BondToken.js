const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BondToken (GOV)", function () {
  let triangleCoin;
  let bondToken;
  let owner;
  let addr1;
  let addr2;
  
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Déployer TRG d'abord
    const TriangleCoin = await ethers.getContractFactory("TriangleCoin");
    triangleCoin = await TriangleCoin.deploy();
    await triangleCoin.waitForDeployment();
    
    // Déployer BondToken (GOV)
    const BondToken = await ethers.getContractFactory("BondToken");
    bondToken = await BondToken.deploy(await triangleCoin.getAddress());
    await bondToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      expect(await bondToken.name()).to.equal("Government Bonds");
      expect(await bondToken.symbol()).to.equal("GOV");
      expect(await bondToken.owner()).to.equal(owner.address);
      expect(await bondToken.paymentToken()).to.equal(await triangleCoin.getAddress());
    });

    it("Should start with zero bonds issued", async function () {
      expect(await bondToken.totalBondsIssued()).to.equal(0);
      expect(await bondToken.nextSerialNumber()).to.equal(1);
    });
  });

  describe("Bond Issuance", function () {
    it("Should issue a bond correctly", async function () {
      const principal = ethers.parseEther("200"); // 200 TRG
      const interestRate = 1000; // 10%
      const duration = 365; // 1 an
      
      await expect(bondToken.issueBond(addr1.address, principal, interestRate, duration))
        .to.emit(bondToken, "BondIssued")
        .withArgs(1, 1, principal, addr1.address);
      
      expect(await bondToken.balanceOf(addr1.address)).to.equal(1);
      expect(await bondToken.totalBondsIssued()).to.equal(1);
      expect(await bondToken.nextSerialNumber()).to.equal(2);
    });

    it("Should calculate total repayment correctly", async function () {
      const principal = ethers.parseEther("200"); // 200 TRG
      const interestRate = 1000; // 10%
      const duration = 365;
      
      await bondToken.issueBond(addr1.address, principal, interestRate, duration);
      
      const bondDetails = await bondToken.getBondDetails(1);
      const expectedRepayment = principal + (principal * BigInt(interestRate) / BigInt(10000));
      
      expect(bondDetails.totalRepayment).to.equal(expectedRepayment);
      expect(bondDetails.totalRepayment).to.equal(ethers.parseEther("220")); // 200 + 20
    });

    it("Should set correct maturity date", async function () {
      const principal = ethers.parseEther("200");
      const interestRate = 1000;
      const duration = 365;
      
      const currentTime = await time.latest();
      await bondToken.issueBond(addr1.address, principal, interestRate, duration);
      
      const bondDetails = await bondToken.getBondDetails(1);
      const expectedMaturity = currentTime + (duration * 24 * 60 * 60); // 365 jours en secondes
      
      expect(bondDetails.maturityDate).to.be.closeTo(expectedMaturity, 2); // ±2 secondes
    });

    it("Should not allow non-owner to issue bonds", async function () {
      const principal = ethers.parseEther("200");
      const interestRate = 1000;
      const duration = 365;
      
      await expect(
        bondToken.connect(addr1).issueBond(addr2.address, principal, interestRate, duration)
      ).to.be.revertedWithCustomError(bondToken, "OwnableUnauthorizedAccount");
    });

    it("Should reject invalid parameters", async function () {
      const principal = ethers.parseEther("200");
      const interestRate = 1000;
      const duration = 365;
      
      // Zero address
      await expect(
        bondToken.issueBond(ethers.ZeroAddress, principal, interestRate, duration)
      ).to.be.revertedWith("Cannot issue to zero address");
      
      // Zero principal
      await expect(
        bondToken.issueBond(addr1.address, 0, interestRate, duration)
      ).to.be.revertedWith("Principal must be greater than 0");
      
      // Zero interest rate
      await expect(
        bondToken.issueBond(addr1.address, principal, 0, duration)
      ).to.be.revertedWith("Interest rate must be greater than 0");
      
      // Zero duration
      await expect(
        bondToken.issueBond(addr1.address, principal, interestRate, 0)
      ).to.be.revertedWith("Duration must be greater than 0");
    });
  });

  describe("Bond Details", function () {
    beforeEach(async function () {
      // Émettre une obligation de test
      await bondToken.issueBond(addr1.address, ethers.parseEther("200"), 1000, 365);
    });

    it("Should return correct bond details", async function () {
      const details = await bondToken.getBondDetails(1);
      
      expect(details.serialNumber).to.equal(1);
      expect(details.principal).to.equal(ethers.parseEther("200"));
      expect(details.interestRate).to.equal(1000);
      expect(details.currentOwner).to.equal(addr1.address);
      expect(details.isRepaid).to.equal(false);
      expect(details.totalRepayment).to.equal(ethers.parseEther("220"));
      expect(details.isMature).to.equal(false); // Pas encore mature
    });

    it("Should calculate interest correctly", async function () {
      const interest = await bondToken.calculateInterest(1);
      expect(interest).to.equal(ethers.parseEther("20")); // 10% de 200 = 20
    });

    it("Should return bonds by owner", async function () {
      // Émettre une autre obligation pour addr1
      await bondToken.issueBond(addr1.address, ethers.parseEther("100"), 500, 180);
      
      const bonds = await bondToken.getBondsByOwner(addr1.address);
      expect(bonds.length).to.equal(2);
      expect(bonds[0]).to.equal(1);
      expect(bonds[1]).to.equal(2);
    });
  });

  describe("Bond Transfers", function () {
    beforeEach(async function () {
      await bondToken.issueBond(addr1.address, ethers.parseEther("200"), 1000, 365);
    });

    it("Should transfer bond correctly", async function () {
      await expect(bondToken.connect(addr1).transferFrom(addr1.address, addr2.address, 1))
        .to.emit(bondToken, "BondTransferred")
        .withArgs(1, addr1.address, addr2.address);
      
      expect(await bondToken.ownerOf(1)).to.equal(addr2.address);
      
      // Vérifier que les métadonnées sont mises à jour
      const details = await bondToken.getBondDetails(1);
      expect(details.currentOwner).to.equal(addr2.address);
    });
  });

  describe("Bond Repayment", function () {
    beforeEach(async function () {
      // Émettre une obligation
      await bondToken.issueBond(addr1.address, ethers.parseEther("200"), 1000, 365);
      
      // Donner des TRG au owner pour le remboursement
      await triangleCoin.mint(owner.address, ethers.parseEther("1000"));
    });

    it("Should not allow repayment before maturity", async function () {
      // Approuver les TRG
      await triangleCoin.approve(await bondToken.getAddress(), ethers.parseEther("220"));
      
      await expect(
        bondToken.repayBond(1)
      ).to.be.revertedWith("Bond not yet mature");
    });

    it("Should allow repayment after maturity", async function () {
      // Avancer le temps de 1 an + 1 jour
      await time.increase(366 * 24 * 60 * 60);
      
      // Approuver les TRG
      await triangleCoin.approve(await bondToken.getAddress(), ethers.parseEther("220"));
      
      const initialBalance = await triangleCoin.balanceOf(addr1.address);
      
      await expect(bondToken.repayBond(1))
        .to.emit(bondToken, "BondRepaid")
        .withArgs(1, ethers.parseEther("220"), addr1.address);
      
      const finalBalance = await triangleCoin.balanceOf(addr1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("220"));
      
      // Vérifier que l'obligation est marquée comme remboursée
      const details = await bondToken.getBondDetails(1);
      expect(details.isRepaid).to.equal(true);
    });

    it("Should not allow double repayment", async function () {
      // Avancer le temps
      await time.increase(366 * 24 * 60 * 60);
      
      // Premier remboursement
      await triangleCoin.approve(await bondToken.getAddress(), ethers.parseEther("220"));
      await bondToken.repayBond(1);
      
      // Tentative de second remboursement
      await expect(
        bondToken.repayBond(1)
      ).to.be.revertedWith("Bond already repaid");
    });
  });

  describe("Global Statistics", function () {
    it("Should track global statistics correctly", async function () {
      // Émettre plusieurs obligations
      await bondToken.issueBond(addr1.address, ethers.parseEther("200"), 1000, 365);
      await bondToken.issueBond(addr2.address, ethers.parseEther("300"), 800, 365);
      
      const stats = await bondToken.getGlobalStats();
      
      expect(stats.totalIssued).to.equal(2);
      expect(stats.totalValue).to.equal(ethers.parseEther("500"));
      expect(stats.totalRepaidAmount).to.equal(0);
      expect(stats.outstandingBonds).to.equal(2);
    });
  });

  describe("Utility Functions", function () {
    it("Should convert days to timestamp correctly", async function () {
      const timestamp = await bondToken.daysToTimestamp(365);
      expect(timestamp).to.equal(365 * 24 * 60 * 60);
    });

    it("Should check bond existence", async function () {
      expect(await bondToken.bondExists(1)).to.equal(false);
      
      await bondToken.issueBond(addr1.address, ethers.parseEther("200"), 1000, 365);
      
      expect(await bondToken.bondExists(1)).to.equal(true);
    });
  });
});
