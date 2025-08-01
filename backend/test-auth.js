const authService = require('./src/services/authService');

async function testAuth() {
  try {
    console.log('🧪 Testing Auth Service...');
    
    // Test 1: Créer un utilisateur
    const testAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const user = await authService.findOrCreateUser(testAddress, {
      name: 'Test User',
      email: 'test@example.com'
    });
    
    console.log('✅ User created/found:', user.address);
    
    // Test 2: Générer un token
    const token = authService.generateToken(user.id, user.address);
    console.log('✅ Token generated:', token.substring(0, 20) + '...');
    
    // Test 3: Vérifier le token
    const decoded = authService.verifyToken(token);
    console.log('✅ Token verified for user:', decoded.userId);
    
    // Test 4: Créer une session
    const session = await authService.createSession(user.id, token);
    console.log('✅ Session created:', session.id);
    
    console.log('🎉 All auth tests passed!');
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  }
}

testAuth();
