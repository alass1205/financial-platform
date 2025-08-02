const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware d'authentification pour toutes les routes portfolio
router.use(requireAuth);

// 💰 GET /api/portfolio/balances - Obtenir les balances depuis la DB
router.get('/balances', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer toutes les balances de l'utilisateur
    const balances = await prisma.balance.findMany({
      where: { userId },
      include: { 
        asset: { 
          select: { 
            symbol: true, 
            name: true, 
            type: true 
          } 
        } 
      }
    });
    
    // Formater les balances pour le frontend
    const formattedBalances = {
      tokens: {},
      nfts: { count: 0, nfts: [], totalValue: 0 }
    };
    
    balances.forEach(balance => {
      const symbol = balance.asset.symbol;
      const available = parseFloat(balance.available) || 0;
      const reserved = parseFloat(balance.reserved) || 0;
      const total = parseFloat(balance.total) || 0;
      
      if (balance.asset.type === 'BOND') {
        // Traitement spécial pour les NFT (GOV)
        const count = Math.floor(available);
        if (count > 0) {
          formattedBalances.nfts.count = count;
          formattedBalances.nfts.totalValue = count * 200; // 200 TRG par obligation
          
          // Créer des NFT fictifs pour l'affichage
          formattedBalances.nfts.nfts = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            value: '200',
            interestRate: '10',
            maturity: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }));
        }
      } else {
        // Tokens ERC20 normaux - CONVERSION DEPUIS WEI
        const availableFormatted = available / Math.pow(10, 18); // Conversion depuis wei
        const reservedFormatted = reserved / Math.pow(10, 18);
        const totalFormatted = total / Math.pow(10, 18);
        
        if (totalFormatted > 0) {
          formattedBalances.tokens[symbol] = {
            raw: total.toString(),
            formatted: availableFormatted.toString(),
            symbol: symbol,
            name: balance.asset.name,
            available: availableFormatted.toString(),
            reserved: reservedFormatted.toString(),
            total: totalFormatted.toString()
          };
        }
      }
    });
    
    console.log('📊 Portfolio balances:', formattedBalances);
    
    res.json({
      status: 'OK',
      balances: formattedBalances,
      source: 'database',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting portfolio balances:', error);
    res.status(500).json({ 
      error: 'Failed to get portfolio balances',
      message: error.message 
    });
  }
});

// 📊 GET /api/portfolio/summary - Résumé du portfolio
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer les balances
    const balances = await prisma.balance.findMany({
      where: { userId },
      include: { asset: true }
    });
    
    // Calculer la valeur totale (en TRG)
    const prices = {
      'TRG': 1,
      'CLV': 50,   // 1 CLV = 50 TRG
      'ROO': 45,   // 1 ROO = 45 TRG
      'GOV': 200   // 1 GOV = 200 TRG
    };
    
    let totalValue = 0;
    const breakdown = {};
    
    balances.forEach(balance => {
      const symbol = balance.asset.symbol;
      const available = parseFloat(balance.available) / Math.pow(10, 18); // Conversion wei
      const price = prices[symbol] || 0;
      const value = available * price;
      
      if (available > 0) {
        totalValue += value;
        breakdown[symbol] = {
          quantity: available,
          price: price,
          value: value,
          percentage: 0 // Calculé après
        };
      }
    });
    
    // Calculer les pourcentages
    Object.keys(breakdown).forEach(symbol => {
      breakdown[symbol].percentage = totalValue > 0 
        ? (breakdown[symbol].value / totalValue * 100) 
        : 0;
    });
    
    res.json({
      status: 'OK',
      summary: {
        totalValue: totalValue.toFixed(2),
        breakdown,
        lastUpdate: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting portfolio summary:', error);
    res.status(500).json({ 
      error: 'Failed to get portfolio summary',
      message: error.message 
    });
  }
});

module.exports = router;
