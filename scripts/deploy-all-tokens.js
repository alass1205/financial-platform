const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Déploiement de tous les tokens...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Déploiement avec le compte:", deployer.address);
  
  // 1. Déployer TRG
  console.log("⏳ Déploiement TRG...");
  const TriangleCoin = await ethers.getContractFactory("TriangleCoin");
  const triangleCoin = await TriangleCoin.deploy();
  await triangleCoin.waitForDeployment();
  const trgAddress = await triangleCoin.getAddress();
  console.log("✅ TRG déployé:", trgAddress);
  
  // 2. Déployer CLV
  console.log("⏳ Déploiement CLV...");
  const ShareToken = await ethers.getContractFactory("ShareToken");
  const clvToken = await ShareToken.deploy(
    "Clove Company",
    "CLV",
    100,
    trgAddress
  );
  await clvToken.waitForDeployment();
  const clvAddress = await clvToken.getAddress();
  console.log("✅ CLV déployé:", clvAddress);
  
  // 3. Déployer ROO
  console.log("⏳ Déploiement ROO...");
  const rooToken = await ShareToken.deploy(
    "Rooibos Limited", 
    "ROO",
    100,
    trgAddress
  );
  await rooToken.waitForDeployment();
  const rooAddress = await rooToken.getAddress();
  console.log("✅ ROO déployé:", rooAddress);
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 RÉSUMÉ DES DÉPLOIEMENTS:");
  console.log("   TRG (Stablecoin):", trgAddress);
  console.log("   CLV (Clove Company):", clvAddress);  
  console.log("   ROO (Rooibos Limited):", rooAddress);
  
  // Vérifier les balances
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💰 BALANCES INITIALES:");
  console.log("   TRG:", ethers.formatEther(await triangleCoin.balanceOf(deployer.address)), "TRG");
  console.log("   CLV:", ethers.formatEther(await clvToken.balanceOf(deployer.address)), "CLV");
  console.log("   ROO:", ethers.formatEther(await rooToken.balanceOf(deployer.address)), "ROO");
  
  // Sauvegarder les adresses
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    deployTime: new Date().toISOString(),
    contracts: {
      TRG: {
        address: trgAddress,
        name: "Triangle Coin",
        symbol: "TRG",
        supply: "4000"
      },
      CLV: {
        address: clvAddress,
        name: "Clove Company",
        symbol: "CLV", 
        supply: "100"
      },
      ROO: {
        address: rooAddress,
        name: "Rooibos Limited",
        symbol: "ROO",
        supply: "100"
      }
    }
  };
  
  const fs = require('fs');
  fs.writeFileSync('all-tokens-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Informations sauvegardées dans all-tokens-deployment.json");
  console.log("🎉 Tous les tokens déployés avec succès !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });
