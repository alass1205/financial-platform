const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateContractAddresses() {
  try {
    console.log('🔄 Updating contract addresses...');
    
    // Nouvelles adresses du déploiement
    const newAddresses = {
      'TRG': '0x3aAde2dCD2Df6a8cAc689EE797591b2913658659',
      'CLV': '0xab16A69A5a8c12C732e0DEFF4BE56A70bb64c926', 
      'ROO': '0xE3011A37A904aB90C8881a99BD1F6E21401f1522',
      'GOV': '0x1f10F3Ba7ACB61b2F50B9d6DdCf91a6f787C0E82'
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
      // ✅ CORRECTION: Suppression des échappements `
      console.log('✅ ' + symbol + ': ' + address);
    }

    console.log('🏦 Vault Address: 0x457cCf29090fe5A24c19c1bc95F492168C0EaFdb');
    console.log('✅ Contract addresses updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateContractAddresses();
