#!/usr/bin/env node
const { ethers } = require("hardhat");
const readline = require('readline');

// Interface pour interaction utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log("🎯 SCRIPT DE POPULATION INTERACTIF");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Ce script configure la plateforme avec les données initiales");
  console.log("comme spécifié dans le cahier des charges.\n");

  // Obtenir les signers
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployer address:", deployer.address);

  // Demander les adresses Aya et Beatriz
  console.log("\n👥 CONFIGURATION DES UTILISATEURS");
  console.log("─────────────────────────────────────────");
  
  const ayaAddress = await question("🧑 Entrez l'adresse Ethereum d'Aya: ");
  const beatrizAddress = await question("👩 Entrez l'adresse Ethereum de Beatriz: ");

  // Validation des adresses
  if (!ethers.isAddress(ayaAddress)) {
    console.error("❌ Adresse Aya invalide");
    process.exit(1);
  }
  
  if (!ethers.isAddress(beatrizAddress)) {
    console.error("❌ Adresse Beatriz invalide");
    process.exit(1);  
  }

  console.log("\n✅ Adresses validées:");
  console.log("   Aya:", ayaAddress);
  console.log("   Beatriz:", beatrizAddress);

  // Confirmer avant déploiement
  const confirm = await question("\n🚀 Lancer le déploiement complet ? (y/N): ");
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log("❌ Déploiement annulé");
    process.exit(0);
  }

  console.log("\n🏗️ DÉPLOIEMENT DES CONTRATS");
  console.log("─────────────────────────────────────────");

  // 1. Déployer TRG (Triangle)
  console.log("⏳ Déploiement TRG...");
  const TriangleCoin = await ethers.getContractFactory("TriangleCoin");
  const triangleCoin = await TriangleCoin.deploy();
  await triangleCoin.waitForDeployment();
  const trgAddress = await triangleCoin.getAddress();
  console.log("✅ TRG déployé:", trgAddress);

  // 2. Déployer CLV (Clove Company)
  console.log("⏳ Déploiement CLV...");
  const ShareToken = await ethers.getContractFactory("ShareToken");
  const clvToken = await ShareToken.deploy("Clove Company", "CLV", 100, trgAddress);
  await clvToken.waitForDeployment();
  const clvAddress = await clvToken.getAddress();
  console.log("✅ CLV déployé:", clvAddress);

  // 3. Déployer ROO (Rooibos Limited)
  console.log("⏳ Déploiement ROO...");
  const rooToken = await ShareToken.deploy("Rooibos Limited", "ROO", 100, trgAddress);
  await rooToken.waitForDeployment();
  const rooAddress = await rooToken.getAddress();
  console.log("✅ ROO déployé:", rooAddress);

  // 4. Déployer GOV (Government Bonds)
  console.log("⏳ Déploiement GOV...");
  const BondToken = await ethers.getContractFactory("BondToken");
  const bondToken = await BondToken.deploy(trgAddress);
  await bondToken.waitForDeployment();
  const govAddress = await bondToken.getAddress();
  console.log("✅ GOV déployé:", govAddress);

  // 5. Déployer Vault
  console.log("⏳ Déploiement Vault...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ Vault déployé:", vaultAddress);

  console.log("\n🔧 CONFIGURATION DU VAULT");
  console.log("─────────────────────────────────────────");

  // Autoriser les tokens dans le Vault
  console.log("⏳ Autorisation des assets...");
  await vault.authorizeToken(trgAddress);
  await vault.authorizeToken(clvAddress);
  await vault.authorizeToken(rooAddress);
  await vault.authorizeNFT(govAddress);
  console.log("✅ Assets autorisés dans le Vault");

  console.log("\n📦 CRÉATION DES OBLIGATIONS");
  console.log("─────────────────────────────────────────");

  // Créer 20 obligations GOV (CORRIGÉ: 4 paramètres)
  console.log("⏳ Émission de 20 obligations...");
  for (let i = 1; i <= 20; i++) {
    // issueBond(to, principal, interestRate, durationInDays)
    await bondToken.issueBond(
      deployer.address, 
      ethers.parseEther("200"), // 200 TRG principal
      1000, // 10% interest rate (1000 basis points)
      365   // 1 year duration (365 days)
    );
    if (i % 5 === 0) console.log(`📋 ${i}/20 obligations créées`);
  }
  console.log("✅ 20 obligations GOV créées");

  console.log("\n💰 DISTRIBUTION INITIALE");
  console.log("─────────────────────────────────────────");

  // Distribution pour Aya: 200 TRG, 10 CLV, 2 GOV
  console.log("🧑 Distribution pour Aya...");
  await triangleCoin.transfer(ayaAddress, ethers.parseEther("200"));
  await clvToken.transfer(ayaAddress, ethers.parseEther("10"));
  await bondToken.transferFrom(deployer.address, ayaAddress, 1);
  await bondToken.transferFrom(deployer.address, ayaAddress, 2);
  console.log("✅ Aya: 200 TRG, 10 CLV, 2 GOV (NFT #1, #2)");

  // Distribution pour Beatriz: 150 TRG, 20 ROO, 5 GOV
  console.log("👩 Distribution pour Beatriz...");
  await triangleCoin.transfer(beatrizAddress, ethers.parseEther("150"));
  await rooToken.transfer(beatrizAddress, ethers.parseEther("20"));
  for (let i = 3; i <= 7; i++) {
    await bondToken.transferFrom(deployer.address, beatrizAddress, i);
  }
  console.log("✅ Beatriz: 150 TRG, 20 ROO, 5 GOV (NFT #3-7)");

  // Sauvegarder les informations
  const deploymentInfo = {
    network: "localhost",
    deployTime: new Date().toISOString(),
    deployer: deployer.address,
    users: {
      aya: { address: ayaAddress, distribution: { TRG: "200", CLV: "10", ROO: "0", GOV: "2" }},
      beatriz: { address: beatrizAddress, distribution: { TRG: "150", CLV: "0", ROO: "20", GOV: "5" }}
    },
    contracts: {
      TRG: { address: trgAddress, name: "Triangle Coin", symbol: "TRG", totalSupply: "4000", type: "Stablecoin" },
      CLV: { address: clvAddress, name: "Clove Company", symbol: "CLV", totalSupply: "100", type: "Share Token" },
      ROO: { address: rooAddress, name: "Rooibos Limited", symbol: "ROO", totalSupply: "100", type: "Share Token" },
      GOV: { address: govAddress, name: "Government Bonds", symbol: "GOV", totalIssued: "20", type: "Bond Token (NFT)" },
      VAULT: { address: vaultAddress, name: "Platform Vault", type: "Custody Contract" }
    }
  };

  const fs = require('fs');
  fs.writeFileSync('interactive-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Informations sauvegardées dans interactive-deployment.json");

  console.log("\n🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ 5 contrats déployés (TRG, CLV, ROO, GOV, Vault)");
  console.log("✅ 20 obligations gouvernementales créées");
  console.log("✅ Distribution initiale effectuée");
  console.log("✅ Données sauvegardées");

  console.log("\n🚀 PROCHAINES ÉTAPES:");
  console.log("1. cd backend && node update-vault-contracts.js");
  console.log("2. cd backend && npm run dev");  
  console.log("3. cd frontend && npm run dev");
  console.log("4. Ouvrir http://localhost:5173");

  rl.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    rl.close();
    process.exit(1);
  });
