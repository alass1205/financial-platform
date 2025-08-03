const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/public/trading/history/:symbol - Historique PUBLIC des prix
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Validation du symbol
    const validSymbols = ['TRG', 'CLV', 'ROO', 'GOV'];
    if (!validSymbols.includes(symbol.toUpperCase())) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }
    
    // Récupérer les trades de la base de données avec les bons champs
    const trades = await prisma.trade.findMany({
      where: {
        asset: {
          symbol: symbol.toUpperCase()
        }
      },
      orderBy: {
        executedAt: 'asc'  // Utiliser executedAt au lieu de createdAt
      },
      take: 50,
      select: {
        id: true,
        quantity: true,
        price: true,
        executedAt: true  // Utiliser executedAt
      }
    });
    
    // Prix par défaut selon le cahier des charges
    const defaultPrices = {
      'TRG': 1,
      'CLV': 10,
      'ROO': 10,
      'GOV': 200
    };
    
    let priceHistory = [];
    
    if (trades.length > 0) {
      // Convertir les trades en données pour graphique
      priceHistory = trades.map((trade, index) => ({
        time: index + 1,
        price: parseFloat(trade.price),
        volume: parseFloat(trade.quantity),
        date: trade.executedAt,  // Utiliser executedAt
        id: trade.id
      }));
    } else {
      // Si pas de trades, utiliser le prix par défaut avec variation
      const defaultPrice = defaultPrices[symbol.toUpperCase()];
      priceHistory = [
        { time: 1, price: defaultPrice * 0.98, volume: 0, date: new Date(Date.now() - 3600000), id: 'default1' },
        { time: 2, price: defaultPrice, volume: 0, date: new Date(Date.now() - 1800000), id: 'default2' },
        { time: 3, price: defaultPrice * 1.02, volume: 0, date: new Date(), id: 'default3' }
      ];
    }
    
    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        history: priceHistory,
        totalTrades: trades.length,
        currentPrice: priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : defaultPrices[symbol.toUpperCase()]
      }
    });
    
  } catch (error) {
    console.error('Erreur historique prix public:', error);
    
    // Fallback avec données par défaut en cas d'erreur
    const defaultPrices = { 'TRG': 1, 'CLV': 10, 'ROO': 10, 'GOV': 200 };
    const defaultPrice = defaultPrices[req.params.symbol.toUpperCase()] || 10;
    
    res.json({
      success: true,
      data: {
        symbol: req.params.symbol.toUpperCase(),
        history: [
          { time: 1, price: defaultPrice * 0.98, volume: 0, date: new Date(), id: 'fallback1' },
          { time: 2, price: defaultPrice, volume: 0, date: new Date(), id: 'fallback2' },
          { time: 3, price: defaultPrice * 1.02, volume: 0, date: new Date(), id: 'fallback3' }
        ],
        totalTrades: 0,
        currentPrice: defaultPrice
      }
    });
  }
});

// GET /api/public/trading/price/:symbol - Prix actuel PUBLIC
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const validSymbols = ['TRG', 'CLV', 'ROO', 'GOV'];
    if (!validSymbols.includes(symbol.toUpperCase())) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }
    
    // Prix par défaut si pas de trade
    const defaultPrices = {
      'TRG': 1,
      'CLV': 10,
      'ROO': 10,
      'GOV': 200
    };
    
    let currentPrice = defaultPrices[symbol.toUpperCase()];
    let lastUpdate = new Date();
    let isDefault = true;
    
    try {
      // Tenter de récupérer le dernier trade
      const lastTrade = await prisma.trade.findFirst({
        where: {
          asset: {
            symbol: symbol.toUpperCase()
          }
        },
        orderBy: {
          executedAt: 'desc'  // Utiliser executedAt
        },
        select: {
          price: true,
          executedAt: true  // Utiliser executedAt
        }
      });
      
      if (lastTrade) {
        currentPrice = parseFloat(lastTrade.price);
        lastUpdate = lastTrade.executedAt;
        isDefault = false;
      }
    } catch (dbError) {
      console.log('DB error, using default price:', dbError.message);
    }
    
    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        price: currentPrice,
        lastUpdate: lastUpdate,
        isDefault: isDefault
      }
    });
    
  } catch (error) {
    console.error('Erreur prix actuel public:', error);
    
    // Fallback avec prix par défaut
    const defaultPrices = { 'TRG': 1, 'CLV': 10, 'ROO': 10, 'GOV': 200 };
    
    res.json({
      success: true,
      data: {
        symbol: req.params.symbol.toUpperCase(),
        price: defaultPrices[req.params.symbol.toUpperCase()] || 10,
        lastUpdate: new Date(),
        isDefault: true
      }
    });
  }
});

module.exports = router;
