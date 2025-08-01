const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 DÉPLOIEMENT COMPLET DE LA PLATEFORME FINANCIÈRE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const [deployer, aya, beatriz] = await ethers.getSigners();
  console.log("📝 Déployeur:", deployer.address);
  console.log("🧑 Aya:", aya.address);
  console.log("👩 Beatriz:", beatriz.address);
  
  console.log("\n🏗️  PHASE 1: DÉPLOIEMENT DES CONTRATS");
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
  
  console.log("\n💰 PHASE 2: POPULATION INITIALE DES DONNÉES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Selon le cahier des charges :
  // - TRG : 4000 unités disponibles (déjà fait au déploiement)
  // - CLV : 100 actions Clove Company
  // - ROO : 100 actions Rooibos Limited  
  // - GOV : 20 obligations de 200 TRG chacune, 10% intérêt, 1 an
  
  console.log("⏳ Création des 20 obligations gouvernementales...");
  for (let i = 1; i <= 20; i++) {
    await bondToken.issueBond(
      deployer.address,
      ethers.parseEther("200"), // 200 TRG de capital
      1000,                     // 10% d'intérêt (1000 = 10%)
      365                       // 1 an
    );
    console.log(`   ✅ Obligation ${i}/20 créée`);
  }
  
  console.log("\n👥 PHASE 3: DISTRIBUTION AUX UTILISATEURS DE TEST");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Distribution selon le cahier des charges :
  // Aya: 200 TRG, 10 CLV, 2 GOV
  // Beatriz: 150 TRG, 20 ROO, 5 GOV
  
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
  
  console.log("\n📊 PHASE 4: VÉRIFICATION DES BALANCES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Vérifications finales
  console.log("🔍 BALANCES FINALES:");
  
  console.log("\n👤 DÉPLOYEUR:");
  console.log(`   TRG: ${ethers.formatEther(await triangleCoin.balanceOf(deployer.address))}`);
  console.log(`   CLV: ${ethers.formatEther(await clvToken.balanceOf(deployer.address))}`);
  console.log(`   ROO: ${ethers.formatEther(await rooToken.balanceOf(deployer.address))}`);
  console.log(`   GOV: ${await bondToken.balanceOf(deployer.address)} obligations`);
  
  console.log("\n🧑 AYA:");
  console.log(`   TRG: ${ethers.formatEther(await triangleCoin.balanceOf(aya.address))}`);
  console.log(`   CLV: ${ethers.formatEther(await clvToken.balanceOf(aya.address))}`);
  console.log(`   ROO: ${ethers.formatEther(await rooToken.balanceOf(aya.address))}`);
  console.log(`   GOV: ${await bondToken.balanceOf(aya.address)} obligations`);
  
  console.log("\n👩 BEATRIZ:");
  console.log(`   TRG: ${ethers.formatEther(await triangleCoin.balanceOf(beatriz.address))}`);
  console.log(`   CLV: ${ethers.formatEther(await clvToken.balanceOf(beatriz.address))}`);
  console.log(`   ROO: ${ethers.formatEther(await rooToken.balanceOf(beatriz.address))}`);
  console.log(`   GOV: ${await bondToken.balanceOf(beatriz.address)} obligations`);
  
  console.log("\n💾 SAUVEGARDE DES INFORMATIONS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Sauvegarder toutes les informations
  const deploymentInfo = {
    network: hre.network.name,
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
  fs.writeFileSync('complete-platform-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Informations complètes sauvegardées dans complete-platform-deployment.json");
  
  console.log("\n🎉 PLATEFORME FINANCIÈRE DÉPLOYÉE AVEC SUCCÈS !");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");  
  console.log("✅ 4 contrats déployés");
  console.log("✅ 20 obligations créées");
  console.log("✅ Distribution initiale effectuée");
  console.log("✅ Données de test prêtes");
  console.log("\n🚀 La blockchain est prête pour le développement du frontend !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });
