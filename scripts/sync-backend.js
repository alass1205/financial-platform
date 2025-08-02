const fs = require('fs');
const path = require('path');

async function syncBackend() {
  try {
    console.log('🔄 Synchronisation backend...');
    
    // Lire le fichier de déploiement pour récupérer les dernières adresses
    const deploymentFile = 'complete-platform-deployment.json';
    
    if (!fs.existsSync(deploymentFile)) {
      console.log('❌ Fichier de déploiement non trouvé. Déployez d\'abord les contrats.');
      return;
    }
    
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    const contracts = deployment.contracts;
    
    console.log('📄 Adresses trouvées dans le déploiement :');
    Object.entries(contracts).forEach(([symbol, info]) => {
      console.log(`   ${symbol}: ${info.address}`);
    });
    
    // 1. Mettre à jour le .env
    console.log('\n⏳ Mise à jour .env backend...');
    const envPath = './backend/.env';
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      envContent = envContent.replace(/TRG_CONTRACT=".*"/, `TRG_CONTRACT="${contracts.TRG.address}"`);
      envContent = envContent.replace(/CLV_CONTRACT=".*"/, `CLV_CONTRACT="${contracts.CLV.address}"`);
      envContent = envContent.replace(/ROO_CONTRACT=".*"/, `ROO_CONTRACT="${contracts.ROO.address}"`);
      envContent = envContent.replace(/GOV_CONTRACT=".*"/, `GOV_CONTRACT="${contracts.GOV.address}"`);
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Fichier .env mis à jour');
    }
    
    // 2. Mettre à jour la DB
    console.log('⏳ Mise à jour base de données...');
    
    const updateScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAddresses() {
  try {
    const updates = [
      { symbol: 'TRG', address: '${contracts.TRG.address}' },
      { symbol: 'CLV', address: '${contracts.CLV.address}' },
      { symbol: 'ROO', address: '${contracts.ROO.address}' },
      { symbol: 'GOV', address: '${contracts.GOV.address}' }
    ];

    for (const {symbol, address} of updates) {
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
                symbol === 'GOV' ? 'BOND' : 'SHARE'
        }
      });
      console.log('✅ ' + symbol + ': ' + address);
    }
    
    console.log('✅ Base de données synchronisée');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur DB:', error.message);
    await prisma.$disconnect();
  }
}

updateAddresses();
`;
    
    fs.writeFileSync('./backend/temp-sync.js', updateScript);
    
    const { execSync } = require('child_process');
    execSync('cd backend && node temp-sync.js', { stdio: 'inherit' });
    
    fs.unlinkSync('./backend/temp-sync.js');
    
    console.log('\n🎉 SYNCHRONISATION TERMINÉE !');
    console.log('✅ Backend prêt - redémarrez le serveur');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

syncBackend();
