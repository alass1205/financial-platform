require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const web3Service = require('./services/web3Service');
const eventService = require('./services/eventService');
const tradingService = require('./services/tradingService');
const apiRoutes = require('./routes/apiRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const authRoutes = require('./routes/authRoutes');
const dividendRoutes = require('./routes/dividends');
const tradingRoutes = require("./routes/tradingRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Variables d'état
let isWeb3Ready = false;
let areEventsReady = false;
let isTradingReady = false;

// Routes de base
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Financial Platform API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      web3Ready: isWeb3Ready,
      eventsReady: areEventsReady,
      tradingReady: isTradingReady,
      authentication: true,
      uptime: process.uptime()
    }
  });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    res.json({ 
      status: 'OK', 
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Routes principales
app.use('/api/auth', authRoutes);
app.use('/api/auth', require('./routes/kyc'));
app.use('/api/dividends', dividendRoutes);
app.use("/api/trading", tradingRoutes);
app.use('/api', apiRoutes);
app.use('/api/portfolio', portfolioRoutes);


// Routes legacy (compatibilité)
app.get('/api/web3/status', async (req, res) => {
  try {
    if (!isWeb3Ready) {
      return res.status(503).json({ 
        status: 'ERROR', 
        message: 'Web3 service not ready' 
      });
    }
    const networkInfo = await web3Service.getNetworkInfo();
    res.json({
      status: 'OK',
      message: 'Web3 service is ready',
      network: networkInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Web3 service error',
      error: error.message 
    });
  }
});

app.get('/api/tokens', async (req, res) => {
  try {
    if (!isWeb3Ready) {
      return res.status(503).json({ error: 'Web3 service not ready' });
    }
    const tokens = await Promise.all([
      web3Service.getTokenInfo('TRG'),
      web3Service.getTokenInfo('CLV'),
      web3Service.getTokenInfo('ROO'),
      web3Service.getTokenInfo('GOV')
    ]);
    res.json({
      status: 'OK',
      tokens,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ 
      error: 'Failed to get token information',
      message: error.message 
    });
  }
});

app.get('/api/events/status', (req, res) => {
  const status = eventService.getListenerStatus();
  res.json({
    status: 'OK',
    eventService: status,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


// Initialiser et démarrer le serveur
async function startServer() {
  try {
    console.log('🚀 Starting Financial Platform API...');
    
    // Initialiser Web3
    console.log('⏳ Initializing Web3 service...');
    await web3Service.initialize();
    isWeb3Ready = true;
    console.log('✅ Web3 service ready');
    
    // Démarrer les event listeners
    console.log('⏳ Starting event listeners...');
    await eventService.startListening();
    areEventsReady = true;
    console.log('✅ Event listeners ready');
    
    // Initialiser le trading service
    console.log('⏳ Initializing Trading service...');
    // Trading service auto-initialized in constructor
    isTradingReady = true;
    console.log('✅ Trading service ready');
    
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔗 API ENDPOINTS:`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   Trading: http://localhost:${PORT}/api/trading/status`);
      console.log(`   Auth: http://localhost:${PORT}/api/auth/login`);
      console.log(`   Status: http://localhost:${PORT}/api/status`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
module.exports = app;

// Routes pour les assets - NOUVEAU
const assetsRoutes = require('./routes/assets');
app.use('/api/assets', assetsRoutes);

// Routes pour l'historique trading - NOUVEAU
const tradingHistoryRoutes = require('./routes/trading-history');
app.use('/api/trading', tradingHistoryRoutes);

console.log('✅ Nouveaux endpoints ajoutés:');
console.log('   GET /api/assets/:symbol - Infos asset');
console.log('   GET /api/trading/history/:symbol - Historique prix');
console.log('   GET /api/trading/price/:symbol - Prix actuel');

// Routes publiques pour trading (sans auth) - NOUVEAU
const publicTradingRoutes = require('./routes/public-trading');
app.use('/api/public/trading', publicTradingRoutes);

console.log('✅ Routes publiques ajoutées:');
console.log('   GET /api/public/trading/history/:symbol');
console.log('   GET /api/public/trading/price/:symbol');
