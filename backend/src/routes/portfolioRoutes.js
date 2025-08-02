const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

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
      
      // 🔧 CORRECTION - Les balances sont déjà en unités normales, pas en wei
      const available = parseFloat(balance.available) || 0;
      const reserved = parseFloat(balance.reserved) || 0;
      const total = parseFloat(balance.total) || 0;
      
      if (balance.asset.type === 'BOND') {
        // Traitement spécial pour les NFT (GOV)
        const count = Math.floor(available);
        if (count > 0) {
          formattedBalances.nfts.count = count;
          formattedBalances.nfts.totalValue = count * 200; // 200 TRG par obligation
          
          // Créer les détails des NFT
          for (let i = 1; i <= count; i++) {
            formattedBalances.nfts.nfts.push({
              id: i,
              value: "200",
              interestRate: "10%",
              maturity: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            });
          }
        }
      } else {
        // Tokens normaux (TRG, CLV, ROO)
        if (total > 0) {
          formattedBalances.tokens[symbol] = {
            raw: (total * Math.pow(10, 18)).toString(), // Conversion pour compatibilité
            formatted: total.toString(),
            symbol: symbol,
            name: balance.asset.name,
            available: available.toString(),
            reserved: reserved.toString(),
            total: total.toString()
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
      // 🔧 CORRECTION - Pas de conversion wei, les données sont déjà en unités
      const available = parseFloat(balance.total) || 0;
      const price = prices[symbol] || 0;
      const value = available * price;
      
      if (available > 0) {
        totalValue += value;
        breakdown[symbol] = {
          quantity: available,
          price: price,
          value: value
        };
      }
    });
    
    res.json({
      status: 'OK',
      totalValue: totalValue,
      breakdown: breakdown,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting portfolio summary:', error);
    res.status(500).json({ 
      error: 'Failed to get portfolio summary',
      message: error.message 
    });
  }
});

// 📈 GET /api/portfolio/performance - Performance du portfolio
router.get('/performance', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Pour l'instant, retourner des données fictives
    res.json({
      status: 'OK',
      performance: {
        dailyChange: 0,
        weeklyChange: 0,
        monthlyChange: 0,
        totalGainLoss: 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting portfolio performance:', error);
    res.status(500).json({ 
      error: 'Failed to get portfolio performance',
      message: error.message 
    });
  }
});

module.exports = router;
