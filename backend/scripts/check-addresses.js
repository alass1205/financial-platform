const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAddresses() {
  try {
    console.log('🔍 Adresses dans la DB :');
    const assets = await prisma.asset.findMany();
    assets.forEach(asset => {
      console.log(`${asset.symbol}: ${asset.contractAddress}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAddresses();
