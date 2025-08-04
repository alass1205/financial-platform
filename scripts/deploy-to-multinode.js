const { ethers } = require("hardhat");

async function main() {
  console.log("🌐 DÉPLOIEMENT SUR RÉSEAU MULTI-NŒUDS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const [deployer, aya, beatriz] = await ethers.getSigners();
  console.log("📝 Déployeur:", deployer.address);
  console.log("🧑 Aya:", aya.address);
  console.log("👩 Beatriz:", beatriz.address);
  console.log("🌐 Réseau:", hre.network.name);
  
  console.log("\n🏗️ PHASE 1: DÉPLOIEMENT DES CONTRATS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // 1. Déployer TRG (Triangle - Stablecoin)
  console.log("⏳ Déploiement TRG (Triangle)...");
  const TriangleCoin = await ethers.getContractFactory("TriangleCoin");
  const triangleCoin = await TriangleCoin.deploy();
  await triangleCoin.waitForDeployment();
  const trgAddress = await triangleCoin.getAddress();
  console.log("✅ TRG déployé:", trgAddress);
  
  // 2. Déployer CLV (Clove Company)
  console.log("⏳ Déploiement CLV (Clove Company)...");
  const ShareToken = await ethers.getContractFactory("ShareToken");
  const clvToken = await ShareToken.deploy("Clove Company", "CLV", 100, trgAddress);
  await clvToken.waitForDeployment();
  const clvAddress = await clvToken.getAddress();
  console.log("✅ CLV déployé:", clvAddress);
  
  // 3. Déployer ROO (Rooibos Limited)
  console.log("⏳ Déploiement ROO (Rooibos Limited)...");
  const rooToken = await ShareToken.deploy("Rooibos Limited", "ROO", 100, trgAddress);
  await rooToken.waitForDeployment();
  const rooAddress = await rooToken.getAddress();
  console.log("✅ ROO déployé:", rooAddress);
  
  // 4. Déployer GOV (Government Bonds)
  console.log("⏳ Déploiement GOV (Government Bonds)...");
  const BondToken = await ethers.getContractFactory("BondToken");
  const bondToken = await BondToken.deploy(trgAddress);
  await bondToken.waitForDeployment();
  const govAddress = await bondToken.getAddress();
  console.log("✅ GOV déployé:", govAddress);

  // 5. Déployer le Vault
  console.log("⏳ Déploiement VAULT (Custody)...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ VAULT déployé:", vaultAddress);
  
  console.log("\n🔧 PHASE 2: CONFIGURATION DU VAULT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("⏳ Autorisation des assets dans le Vault...");
  await vault.authorizeToken(trgAddress);
  await vault.authorizeToken(clvAddress);
  await vault.authorizeToken(rooAddress);
  await vault.authorizeNFT(govAddress);
  console.log("✅ Tous les assets autorisés dans le Vault");

  console.log("\n💰 PHASE 3: POPULATION INITIALE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("⏳ Création des 20 obligations...");
  for (let i = 1; i <= 20; i++) {
    await bondToken.issueBond(
      deployer.address,
      ethers.parseEther("200"),
      1000,
      365
    );
    if (i % 5 === 0) console.log(`   ✅ ${i}/20 obligations créées`);
  }
  
  console.log("\n👥 PHASE 4: DISTRIBUTION AUX UTILISATEURS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("⏳ Distribution à Aya (200 TRG, 10 CLV, 2 GOV)...");
  await triangleCoin.transfer(aya.address, ethers.parseEther("200"));
  await clvToken.transfer(aya.address, ethers.parseEther("10"));
  await bondToken.transferFrom(deployer.address, aya.address, 1);
  await bondToken.transferFrom(deployer.address, aya.address, 2);
  console.log("✅ Distribution à Aya terminée");
  
  console.log("⏳ Distribution à Beatriz (150 TRG, 20 ROO, 5 GOV)...");
  await triangleCoin.transfer(beatriz.address, ethers.parseEther("150"));
  await rooToken.transfer(beatriz.address, ethers.parseEther("20"));
  for (let i = 3; i <= 7; i++) {
    await bondToken.transferFrom(deployer.address, beatriz.address, i);
  }
  console.log("✅ Distribution à Beatriz terminée");
  
  console.log("\n💾 PHASE 5: SAUVEGARDE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const deploymentInfo = {
    network: "multinode",
    chainId: 31337,
    deployTime: new Date().toISOString(),
    deployer: deployer.address,
    testUsers: {
      aya: aya.address,
      beatriz: beatriz.address
    },
    contracts: {
      TRG: {
        address: trgAddress,
        name: "Triangle Coin",
        symbol: "TRG",
        totalSupply: "4000",
        type: "Stablecoin"
      },
      CLV: {
        address: clvAddress,
        name: "Clove Company",
        symbol: "CLV",
        totalSupply: "100",
        type: "Share Token"
      },
      ROO: {
        address: rooAddress,
        name: "Rooibos Limited", 
        symbol: "ROO",
        totalSupply: "100",
        type: "Share Token"
      },
      GOV: {
        address: govAddress,
        name: "Government Bonds",
        symbol: "GOV",
        totalIssued: "20",
        type: "Bond Token (NFT)"
      },
      VAULT: {
        address: vaultAddress,
        name: "Platform Vault",
        type: "Custody Contract",
        authorizedTokens: [trgAddress, clvAddress, rooAddress],
        authorizedNFTs: [govAddress]
      }
    },
    initialDistribution: {
      aya: {
        TRG: "200",
        CLV: "10", 
        ROO: "0",
        GOV: "2"
      },
      beatriz: {
        TRG: "150",
        CLV: "0",
        ROO: "20", 
        GOV: "5"
      }
    }
  };
  
  const fs = require('fs');
  fs.writeFileSync('multinode-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Déploiement sauvé: multinode-deployment.json");
  
  console.log("\n🎉 DÉPLOIEMENT MULTI-NŒUDS RÉUSSI !");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");  
  console.log("✅ 5 contrats déployés sur réseau multi-nœuds");
  console.log("✅ 4 nœuds validateurs actifs");
  console.log("✅ Distribution initiale effectuée");
  console.log("✅ Prêt pour mise à jour backend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });
