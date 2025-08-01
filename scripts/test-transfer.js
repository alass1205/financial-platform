const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Test de transfert pour déclencher les événements...");
  
  const [deployer, aya, beatriz] = await ethers.getSigners();
  
  // Se connecter au contrat TRG
  const TriangleCoin = await ethers.getContractFactory("TriangleCoin");
  const trgAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
  const trg = TriangleCoin.attach(trgAddress);
  
  console.log("💰 Transfert de 50 TRG de Aya vers Beatriz...");
  
  // Transfert de 50 TRG
  const tx = await trg.connect(aya).transfer(beatriz.address, ethers.parseEther("50"));
  await tx.wait();
  
  console.log("✅ Transfert effectué !");
  console.log("📝 Transaction hash:", tx.hash);
  console.log("🔍 Vérifie ton serveur backend pour voir l'événement détecté !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });
