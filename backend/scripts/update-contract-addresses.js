const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateContractAddresses() {
  try {
    console.log('🔄 Updating contract addresses...');
    
    // Nouvelles adresses du déploiement
    const newAddresses = {
      'TRG': '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      'CLV': '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', 
      'ROO': '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      'GOV': '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
    };

    for (const [symbol, address] of Object.entries(newAddresses)) {
      await prisma.asset.update({
        where: { symbol },
        data: { contractAddress: address }
      });
      console.log(`✅ ${symbol}: ${address}`);
    }

    console.log('✅ Contract addresses updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateContractAddresses();
