const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBalances() {
  console.log('💰 Creating initial balances...');

  try {
    // Récupérer les utilisateurs créés
    const aya = await prisma.user.findUnique({
      where: { address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }
    });
    
    const beatriz = await prisma.user.findUnique({
      where: { address: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc' }
    });

    if (!aya || !beatriz) {
      throw new Error('Users not found! Run create-users.js first');
    }

    console.log(`✅ Found users: Aya (${aya.id}), Beatriz (${beatriz.id})`);

    // Récupérer les assets
    const assets = await prisma.asset.findMany();
    console.log('📋 Assets found:', assets.map(a => a.symbol));

    // Définir les balances initiales (CONVERTIR EN STRING)
    const balances = [
      // Aya: 200 TRG + 10 CLV + 0 ROO + 2 GOV
      { userId: aya.id, assetSymbol: 'TRG', available: '200', reserved: '0', total: '200' },
      { userId: aya.id, assetSymbol: 'CLV', available: '10', reserved: '0', total: '10' },
      { userId: aya.id, assetSymbol: 'ROO', available: '0', reserved: '0', total: '0' },
      { userId: aya.id, assetSymbol: 'GOV', available: '2', reserved: '0', total: '2' },
      
      // Beatriz: 150 TRG + 0 CLV + 20 ROO + 5 GOV
      { userId: beatriz.id, assetSymbol: 'TRG', available: '150', reserved: '0', total: '150' },
      { userId: beatriz.id, assetSymbol: 'CLV', available: '0', reserved: '0', total: '0' },
      { userId: beatriz.id, assetSymbol: 'ROO', available: '20', reserved: '0', total: '20' },
      { userId: beatriz.id, assetSymbol: 'GOV', available: '5', reserved: '0', total: '5' }
    ];

    // Créer les balances
    for (const bal of balances) {
      const asset = assets.find(a => a.symbol === bal.assetSymbol);
      if (asset) {
        const created = await prisma.balance.upsert({
          where: {
            userId_assetId: {
              userId: bal.userId,
              assetId: asset.id
            }
          },
          update: {
            available: bal.available,
            reserved: bal.reserved,
            total: bal.total
          },
          create: {
            userId: bal.userId,
            assetId: asset.id,
            available: bal.available,
            reserved: bal.reserved,
            total: bal.total
          }
        });
        console.log(`✅ Balance created: ${bal.assetSymbol} = ${bal.total}`);
      }
    }

    console.log('🎉 Balances created successfully!');

  } catch (error) {
    console.error('❌ Error creating balances:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBalances();
