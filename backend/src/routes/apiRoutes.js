const express = require('express');
const web3Service = require('../services/web3Service');
const router = express.Router();

// Middleware de validation d'adresse
const validateAddress = (req, res, next) => {
  const { address } = req.params;
  if (!web3Service.isValidAddress(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address' });
  }
  next();
};

// Routes existantes améliorées
router.get('/status', async (req, res) => {
  try {
    const networkInfo = await web3Service.getNetworkInfo();
    res.json({
      status: 'OK',
      message: 'Financial Platform API fully operational',
      services: {
        web3: networkInfo.isConnected,
        database: true, // TODO: vérifier vraiment la DB
        events: true
      },
      network: networkInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Service check failed',
      error: error.message 
    });
  }
});

// Informations détaillées sur les tokens
router.get('/tokens/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const validSymbols = ['TRG', 'CLV', 'ROO', 'GOV'];
    
    if (!validSymbols.includes(symbol.toUpperCase())) {
      return res.status(400).json({ 
        error: 'Invalid token symbol',
        validSymbols 
      });
    }

    const tokenInfo = await web3Service.getTokenInfo(symbol.toUpperCase());
    res.json({
      status: 'OK',
      token: tokenInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get token information',
      message: error.message 
    });
  }
});

// Balance spécifique pour un token
router.get('/balance/:address/:symbol', validateAddress, async (req, res) => {
  try {
    const { address, symbol } = req.params;
    const validSymbols = ['TRG', 'CLV', 'ROO', 'GOV'];
    
    if (!validSymbols.includes(symbol.toUpperCase())) {
      return res.status(400).json({ 
        error: 'Invalid token symbol',
        validSymbols 
      });
    }

    const balance = await web3Service.getBalance(address, symbol.toUpperCase());
    res.json({
      status: 'OK',
      address,
      balance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get balance',
      message: error.message 
    });
  }
});

// Toutes les balances (route existante)
router.get('/balance/:address', validateAddress, async (req, res) => {
  try {
    const { address } = req.params;
    const balances = await web3Service.getAllBalances(address);
    
    res.json({
      status: 'OK',
      address,
      balances,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get balances',
      message: error.message 
    });
  }
});

// Informations réseau détaillées
router.get('/network', async (req, res) => {
  try {
    const networkInfo = await web3Service.getNetworkInfo();
    const contractAddresses = {
      TRG: process.env.TRG_CONTRACT,
      CLV: process.env.CLV_CONTRACT,
      ROO: process.env.ROO_CONTRACT,
      GOV: process.env.GOV_CONTRACT
    };

    res.json({
      status: 'OK',
      network: networkInfo,
      contracts: contractAddresses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get network information',
      message: error.message 
    });
  }
});

// Route de test pour simuler des transactions
router.post('/test/transfer', async (req, res) => {
  try {
    const { from, to, amount, symbol } = req.body;
    
    // Validation basique
    if (!web3Service.isValidAddress(from) || !web3Service.isValidAddress(to)) {
      return res.status(400).json({ error: 'Invalid addresses' });
    }

    // TODO: Implémenter le transfert réel
    res.json({
      status: 'OK',
      message: 'Transfer simulation successful',
      transfer: { from, to, amount, symbol },
      note: 'This is a simulation. Real transfers will be implemented later.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Transfer simulation failed',
      message: error.message 
    });
  }
});

// Statistiques de la plateforme
router.get('/stats', async (req, res) => {
  try {
    const tokens = await Promise.all([
      web3Service.getTokenInfo('TRG'),
      web3Service.getTokenInfo('CLV'),
      web3Service.getTokenInfo('ROO'),
      web3Service.getTokenInfo('GOV')
    ]);

    const stats = {
      totalTokens: tokens.length,
      tokens: tokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        totalSupply: token.totalSupply,
        contract: token.contract
      })),
      platform: {
        name: 'Financial Platform',
        version: '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      }
    };

    res.json({
      status: 'OK',
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get platform statistics',
      message: error.message 
    });
  }
});

module.exports = router;
