const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUsers() {
  console.log('👥 Creating test users...');

  try {
    // Créer Aya
    const aya = await prisma.user.upsert({
      where: { address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' },
      update: {},
      create: {
        address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        name: 'Aya',
        firstName: 'Aya',
        lastName: 'Test',
        country: 'FR',
        isVerified: true
      }
    });
    console.log('✅ User created: Aya -', aya.address);

    // Créer Beatriz
    const beatriz = await prisma.user.upsert({
      where: { address: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc' },
      update: {},
      create: {
        address: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
        name: 'Beatriz',
        firstName: 'Beatriz',
        lastName: 'Test',
        country: 'ES',
        isVerified: true
      }
    });
    console.log('✅ User created: Beatriz -', beatriz.address);

    console.log('🎉 Users created successfully!');

  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();
