const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/trading/history/:symbol - Historique des prix d'un asset
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Validation du symbol
    const validSymbols = ['TRG', 'CLV', 'ROO', 'GOV'];
    if (!validSymbols.includes(symbol.toUpperCase())) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }
    
    // Récupérer les trades de la base de données
    const trades = await prisma.trade.findMany({
      where: {
        asset: {
          symbol: symbol.toUpperCase()
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 50, // Limiter à 50 derniers trades
      select: {
        id: true,
        quantity: true,
        price: true,
        createdAt: true,
        asset: {
          select: {
            symbol: true,
            name: true
          }
        }
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
        date: trade.createdAt,
        id: trade.id
      }));
    } else {
      // Si pas de trades, utiliser le prix par défaut
      const defaultPrice = defaultPrices[symbol.toUpperCase()];
      priceHistory = [
        { time: 1, price: defaultPrice, volume: 0, date: new Date(), id: 'default' },
        { time: 2, price: defaultPrice, volume: 0, date: new Date(), id: 'default2' },
        { time: 3, price: defaultPrice, volume: 0, date: new Date(), id: 'default3' }
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
    console.error('Erreur historique prix:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// GET /api/trading/price/:symbol - Prix actuel d'un asset
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const validSymbols = ['TRG', 'CLV', 'ROO', 'GOV'];
    if (!validSymbols.includes(symbol.toUpperCase())) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }
    
    // Récupérer le dernier trade pour le prix actuel
    const lastTrade = await prisma.trade.findFirst({
      where: {
        asset: {
          symbol: symbol.toUpperCase()
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        price: true,
        createdAt: true
      }
    });
    
    // Prix par défaut si pas de trade
    const defaultPrices = {
      'TRG': 1,
      'CLV': 10,
      'ROO': 10,
      'GOV': 200
    };
    
    const currentPrice = lastTrade ? parseFloat(lastTrade.price) : defaultPrices[symbol.toUpperCase()];
    
    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        price: currentPrice,
        lastUpdate: lastTrade ? lastTrade.createdAt : new Date(),
        isDefault: !lastTrade
      }
    });
    
  } catch (error) {
    console.error('Erreur prix actuel:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

module.exports = router;
