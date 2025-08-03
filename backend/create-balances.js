const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBalances() {
  console.log('💰 Creating initial balances...');
  
  // IDs des users (récupérés des tokens)
  const user1Id = "cmdvpjyy10000sqieaphnaje4";
  const user2Id = "cmdvpknms0005sqiejue013jl";
  
  // Récupérer les assets
  const assets = await prisma.asset.findMany();
  console.log('📋 Assets found:', assets.map(a => a.symbol));
  
  // Balances initiales
  const balances = [
    // USER 1
    { userId: user1Id, assetSymbol: 'TRG', amount: '100' },
    { userId: user1Id, assetSymbol: 'CLV', amount: '10' },
    { userId: user1Id, assetSymbol: 'ROO', amount: '0' },
    
    // USER 2  
    { userId: user2Id, assetSymbol: 'TRG', amount: '100' },
    { userId: user2Id, assetSymbol: 'CLV', amount: '0' },
    { userId: user2Id, assetSymbol: 'ROO', amount: '20' }
  ];
  
  for (const bal of balances) {
    const asset = assets.find(a => a.symbol === bal.assetSymbol);
    if (asset) {
      const created = await prisma.balance.create({
        data: {
          userId: bal.userId,
          assetId: asset.id,
          available: bal.amount,
          reserved: '0',
          total: bal.amount
        }
      });
      console.log(`✅ Balance created: User ${bal.userId.slice(-6)} -> ${bal.amount} ${bal.assetSymbol}`);
    }
  }
  
  console.log('🎉 Initial balances created!');
  await prisma.$disconnect();
}

createBalances().catch(console.error);
