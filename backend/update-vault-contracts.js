const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateContracts() {
  console.log('🔄 Mise à jour des contrats dans la DB...');
  
  const contracts = [
    { symbol: 'TRG', address: '0x70e0bA845a1A0F2DA3359C97E0285013525FFC49', name: 'Triangle Coin', type: 'STABLECOIN' },
    { symbol: 'CLV', address: '0x4826533B4897376654Bb4d4AD88B7faFD0C98528', name: 'Clove Company', type: 'SHARE' },
    { symbol: 'ROO', address: '0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf', name: 'Rooibos Limited', type: 'SHARE' },
    { symbol: 'GOV', address: '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF', name: 'Government Bonds', type: 'BOND' }
  ];

  for (const contract of contracts) {
    await prisma.asset.upsert({
      where: { symbol: contract.symbol },
      update: { 
        contractAddress: contract.address,
        name: contract.name,
        type: contract.type
      },
      create: {
        symbol: contract.symbol,
        name: contract.name,
        contractAddress: contract.address,
        type: contract.type,
        decimals: contract.symbol === 'GOV' ? 0 : 18
      }
    });
    console.log(`✅ ${contract.symbol} mis à jour: ${contract.address}`);
  }

  console.log('\n🏦 Vault Address: 0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf');
  console.log('🎉 Mise à jour terminée !');
  await prisma.$disconnect();
}

updateContracts().catch(console.error);
