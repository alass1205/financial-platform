const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAssets() {
  console.log('🌱 Seeding assets...');
  
  // Créer les assets de base avec les bons types enum
  const assets = [
    {
      symbol: 'TRG',
      name: 'Triangle Coin',
      contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      type: 'STABLECOIN',
      decimals: 18
    },
    {
      symbol: 'CLV',
      name: 'Clove Company',
      contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      type: 'SHARE',
      decimals: 18
    },
    {
      symbol: 'ROO',
      name: 'Rooibos Limited',
      contractAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      type: 'SHARE',
      decimals: 18
    },
    {
      symbol: 'GOV',
      name: 'Government Bonds',
      contractAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      type: 'BOND',
      decimals: 0
    }
  ];

  for (const asset of assets) {
    const created = await prisma.asset.upsert({
      where: { symbol: asset.symbol },
      update: {},
      create: asset
    });
    console.log(`✅ Asset created: ${created.symbol} - ${created.name}`);
  }

  console.log('🎉 Assets seeded successfully!');
  await prisma.$disconnect();
}

seedAssets().catch(console.error);
