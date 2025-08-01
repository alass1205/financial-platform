const { ethers } = require("hardhat");

async function main() {
  console.log("🪙 Déploiement du Token TRG (Triangle Coin)...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Déploiement avec le compte:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Solde du compte:", ethers.formatEther(balance), "ETH");
  
  const TriangleCoin = await ethers.getContractFactory("TriangleCoin");
  console.log("⏳ Déploiement en cours...");
  
  const triangleCoin = await TriangleCoin.deploy();
  await triangleCoin.waitForDeployment();
  
  const contractAddress = await triangleCoin.getAddress();
  
  console.log("✅ TriangleCoin déployé à l'adresse:", contractAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const [name, symbol, decimals, totalSupply] = await triangleCoin.getTokenInfo();
  
  console.log("📊 INFORMATIONS DU TOKEN:");
  console.log("   Nom:", name);
  console.log("   Symbole:", symbol);
  console.log("   Décimales:", decimals);
  console.log("   Supply totale:", ethers.formatEther(totalSupply), "TRG");
  console.log("   Propriétaire:", await triangleCoin.owner());
  
  const deployerBalance = await triangleCoin.balanceOf(deployer.address);
  console.log("   Balance déployeur:", ethers.formatEther(deployerBalance), "TRG");
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 Déploiement TRG terminé avec succès !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });
