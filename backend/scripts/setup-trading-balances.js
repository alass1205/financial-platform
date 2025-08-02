const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupTradingBalances() {
  try {
    console.log('🏦 Setting up trading balances...');
    
    // Créer des utilisateurs de test si ils n'existent pas
    const testUsers = [
      {
        address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        name: 'Deployer'
      },
      {
        address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', 
        name: 'Aya'
      },
      {
        address: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
        name: 'Beatriz'
      }
    ];

    // Assets
    const assets = await prisma.asset.findMany();
    if (assets.length === 0) {
      console.log('📄 Creating assets...');
      await prisma.asset.createMany({
        data: [
          {
            symbol: 'TRG',
            name: 'Triangle Coin',
            contractAddress: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
            type: 'STABLECOIN'
          },
          {
            symbol: 'CLV',
            name: 'Clove Company',
            contractAddress: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
            type: 'SHARE'
          },
          {
            symbol: 'ROO',
            name: 'Rooibos Limited',
            contractAddress: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
            type: 'SHARE'
          },
          {
            symbol: 'GOV',
            name: 'Government Bonds',
            contractAddress: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
            type: 'BOND'
          }
        ]
      });
    }

    const allAssets = await prisma.asset.findMany();
    
    // Créer des balances pour les tests
    for (const userData of testUsers) {
      let user = await prisma.user.findUnique({
        where: { address: userData.address }
      });

      if (!user) {
        user = await prisma.user.create({
          data: userData
        });
      }

      // Créer des balances réalistes pour le trading
      for (const asset of allAssets) {
        const existingBalance = await prisma.balance.findUnique({
          where: {
            userId_assetId: {
              userId: user.id,
              assetId: asset.id
            }
          }
        });

        if (!existingBalance) {
          let available = '0';
          
          if (user.name === 'Deployer') {
            switch (asset.symbol) {
              case 'TRG': available = '3650000000000000000000'; break;
              case 'CLV': available = '90000000000000000000'; break;
              case 'ROO': available = '80000000000000000000'; break;
              case 'GOV': available = '13'; break;
            }
          } else if (user.name === 'Aya') {
            switch (asset.symbol) {
              case 'TRG': available = '150000000000000000000'; break;
              case 'CLV': available = '10000000000000000000'; break;
              case 'ROO': available = '0'; break;
              case 'GOV': available = '2'; break;
            }
          } else if (user.name === 'Beatriz') {
            switch (asset.symbol) {
              case 'TRG': available = '200000000000000000000'; break;
              case 'CLV': available = '0'; break;
              case 'ROO': available = '20000000000000000000'; break;
              case 'GOV': available = '5'; break;
            }
          }

          await prisma.balance.create({
            data: {
              userId: user.id,
              assetId: asset.id,
              available,
              reserved: '0',
              total: available
            }
          });
        }
      }
    }

    console.log('✅ Trading balances setup completed');
    
    const users = await prisma.user.findMany({
      include: {
        balances: {
          include: { asset: true }
        }
      }
    });

    console.log('\n📊 BALANCES SUMMARY:');
    for (const user of users) {
      console.log(`\n👤 ${user.name.toUpperCase()} (${user.address}):`);
      for (const balance of user.balances) {
        const symbol = balance.asset.symbol;
        let formattedAmount;
        
        if (symbol === 'GOV') {
          formattedAmount = balance.available;
        } else {
          formattedAmount = (parseFloat(balance.available) / 1e18).toFixed(2);
        }
        
        console.log(`   ${symbol}: ${formattedAmount} ${symbol === 'GOV' ? 'bonds' : symbol}`);
      }
    }

    console.log('\n🎯 SETUP TERMINÉ ! Les utilisateurs peuvent trader !');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTradingBalances();
