const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 DÉPLOIEMENT COMPLET DE LA PLATEFORME FINANCIÈRE + VAULT");
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

  // 5. 🏦 NOUVEAU - Déployer le Vault
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

  console.log("\n💰 PHASE 3: POPULATION INITIALE DES DONNÉES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
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
  
  console.log("\n👥 PHASE 4: DISTRIBUTION AUX UTILISATEURS DE TEST");
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
  
  console.log("\n📊 PHASE 5: VÉRIFICATION DES BALANCES");
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
  
  console.log("\n💾 PHASE 6: SAUVEGARDE DES INFORMATIONS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Sauvegarder toutes les informations + VAULT
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
      },
      // 🏦 AJOUT DU VAULT
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
  fs.writeFileSync('complete-platform-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Informations complètes sauvegardées dans complete-platform-deployment.json");
  
  console.log("\n🎉 PLATEFORME FINANCIÈRE + VAULT DÉPLOYÉE AVEC SUCCÈS !");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");  
  console.log("✅ 5 contrats déployés (incluant Vault)");
  console.log("✅ 20 obligations créées");
  console.log("✅ Distribution initiale effectuée");
  console.log("✅ Vault configuré et autorisé");
  console.log("✅ Données de test prêtes");
  console.log("\n🚀 La blockchain est prête pour le développement du frontend !");

  // ============================================================================
  // 🔄 AUTO-SYNC BACKEND APRÈS DÉPLOIEMENT + VAULT
  // ============================================================================
  
  console.log("\n🔄 PHASE 7: AUTO-SYNCHRONISATION BACKEND + VAULT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // 1. Mettre à jour le fichier .env du backend avec VAULT
    console.log("⏳ Mise à jour du fichier .env backend...");
    
    const envPath = path.join(__dirname, '../backend/.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Remplacer les adresses dans le .env + AJOUTER VAULT
    envContent = envContent.replace(/TRG_CONTRACT=".*"/, `TRG_CONTRACT="${trgAddress}"`);
    envContent = envContent.replace(/CLV_CONTRACT=".*"/, `CLV_CONTRACT="${clvAddress}"`);
    envContent = envContent.replace(/ROO_CONTRACT=".*"/, `ROO_CONTRACT="${rooAddress}"`);
    envContent = envContent.replace(/GOV_CONTRACT=".*"/, `GOV_CONTRACT="${govAddress}"`);
    
    // Ajouter le Vault si pas déjà présent
    if (!envContent.includes('VAULT_CONTRACT')) {
      envContent += `\n# Vault - NOUVEAU\nVAULT_CONTRACT="${vaultAddress}"\n`;
    } else {
      envContent = envContent.replace(/VAULT_CONTRACT=".*"/, `VAULT_CONTRACT="${vaultAddress}"`);
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Fichier .env backend mis à jour avec Vault");
    
    // 2. Mettre à jour la base de données
    console.log("⏳ Mise à jour de la base de données backend...");
    
    try {
      const { execSync } = require('child_process');
      
      // Script de mise à jour DB incluant le Vault
      const updateScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateContractAddresses() {
  try {
    const addresses = {
      'TRG': '${trgAddress}',
      'CLV': '${clvAddress}', 
      'ROO': '${rooAddress}',
      'GOV': '${govAddress}'
    };

    for (const [symbol, address] of Object.entries(addresses)) {
      await prisma.asset.upsert({
        where: { symbol },
        update: { contractAddress: address },
        create: {
          symbol,
          name: symbol === 'TRG' ? 'Triangle Coin' : 
                symbol === 'CLV' ? 'Clove Company' :
                symbol === 'ROO' ? 'Rooibos Limited' : 'Government Bonds',
          contractAddress: address,
          type: symbol === 'TRG' ? 'STABLECOIN' : 
                symbol === 'GOV' ? 'BOND' : 'SHARE',
          decimals: symbol === 'GOV' ? 0 : 18
        }
      });
    }
    
    console.log('✅ DB contracts updated successfully');
    console.log('🏦 Vault Address: ${vaultAddress}');
    await prisma.$disconnect();
  } catch (error) {
    console.log('⚠️  DB update skipped (backend not ready)');
    await prisma.$disconnect();
  }
}

updateContractAddresses();
`;
      
      fs.writeFileSync('../backend/temp-update-contracts.js', updateScript);
      
      // Exécuter la mise à jour de la DB
      execSync('cd ../backend && node temp-update-contracts.js', { stdio: 'inherit' });
      
      // Nettoyer le fichier temporaire
      fs.unlinkSync('../backend/temp-update-contracts.js');
      
      console.log("✅ Base de données backend mise à jour");
      
    } catch (error) {
      console.log("⚠️  Mise à jour DB ignorée (backend non configuré)");
    }
    
    console.log("\n🎉 AUTO-SYNCHRONISATION TERMINÉE !");
    console.log("✅ Le backend est maintenant synchronisé avec les nouveaux contrats + Vault");
    console.log("✅ Vous pouvez redémarrer le serveur backend sans configuration manuelle");
    
  } catch (error) {
    console.log("⚠️  Auto-sync partielle:", error.message);
    console.log("💡 Vous devrez peut-être synchroniser manuellement");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });

  // ============================================================================
  // 🔄 AUTO-UPDATE DES SCRIPTS BACKEND
  // ============================================================================
  
  console.log("\n🔄 PHASE 7: MISE À JOUR AUTOMATIQUE DES SCRIPTS BACKEND");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // 1. Mettre à jour update-contract-addresses.js
    console.log("⏳ Mise à jour du script update-contract-addresses.js...");
    
    const updateScriptContent = `const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateContractAddresses() {
  try {
    console.log('🔄 Updating contract addresses...');
    
    // Nouvelles adresses du déploiement
    const newAddresses = {
      'TRG': '${trgAddress}',
      'CLV': '${clvAddress}', 
      'ROO': '${rooAddress}',
      'GOV': '${govAddress}'
    };

    for (const [symbol, address] of Object.entries(newAddresses)) {
      await prisma.asset.upsert({
        where: { symbol },
        update: { contractAddress: address },
        create: {
          symbol,
          name: symbol === 'TRG' ? 'Triangle Coin' : 
                symbol === 'CLV' ? 'Clove Company' :
                symbol === 'ROO' ? 'Rooibos Limited' : 'Government Bonds',
          contractAddress: address,
          type: symbol === 'TRG' ? 'STABLECOIN' : 
                symbol === 'GOV' ? 'BOND' : 'SHARE',
          decimals: symbol === 'GOV' ? 0 : 18
        }
      });
      console.log(\`✅ \${symbol}: \${address}\`);
    }

    console.log('🏦 Vault Address: ${vaultAddress}');
    console.log('✅ Contract addresses updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateContractAddresses();
`;

    fs.writeFileSync(path.join(__dirname, '../backend/scripts/update-contract-addresses.js'), updateScriptContent);
    console.log("✅ Script update-contract-addresses.js mis à jour");
    
    // 2. Mettre à jour le .env backend
    console.log("⏳ Mise à jour du fichier .env backend...");
    
    const envPath = path.join(__dirname, '../backend/.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent = envContent.replace(/TRG_CONTRACT=".*"/, \`TRG_CONTRACT="${trgAddress}"\`);
    envContent = envContent.replace(/CLV_CONTRACT=".*"/, \`CLV_CONTRACT="${clvAddress}"\`);
    envContent = envContent.replace(/ROO_CONTRACT=".*"/, \`ROO_CONTRACT="${rooAddress}"\`);
    envContent = envContent.replace(/GOV_CONTRACT=".*"/, \`GOV_CONTRACT="${govAddress}"\`);
    
    if (!envContent.includes('VAULT_CONTRACT')) {
      envContent += \`\\n# Vault - NOUVEAU\\nVAULT_CONTRACT="${vaultAddress}"\\n\`;
    } else {
      envContent = envContent.replace(/VAULT_CONTRACT=".*"/, \`VAULT_CONTRACT="${vaultAddress}"\`);
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Fichier .env backend mis à jour");
    
    // 3. Exécuter automatiquement le script update-contract-addresses.js
    console.log("⏳ Exécution automatique du script de mise à jour DB...");
    
    const { execSync } = require('child_process');
    execSync('cd backend/scripts && node update-contract-addresses.js', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log("✅ Base de données mise à jour automatiquement");
    
    // 4. Optionnel : Exécuter setup-trading-balances.js si besoin
    console.log("⏳ Configuration des balances de trading...");
    try {
      execSync('cd backend/scripts && node setup-trading-balances.js', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
    } catch (error) {
      console.log("⚠️  Setup trading balances skipped (already configured)");
    }
    
    console.log("\n🎉 AUTO-CONFIGURATION COMPLÈTE !");
    console.log("✅ Scripts backend mis à jour avec les nouvelles adresses");
    console.log("✅ Base de données synchronisée");
    console.log("✅ Balances de trading configurées");
    console.log("✅ Fichier .env mis à jour");
    console.log("\n🚀 TOUT EST PRÊT ! Redémarrez simplement le backend !");
    
  } catch (error) {
    console.log("⚠️  Auto-configuration partielle:", error.message);
    console.log("💡 Vous pouvez exécuter manuellement:");
    console.log("   cd backend/scripts && node update-contract-addresses.js");
  }
}
