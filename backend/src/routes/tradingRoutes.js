const express = require('express');
const tradingService = require('../services/tradingService');
const vaultService = require('../services/vaultService');
const web3Service = require('../services/web3Service');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes trading
router.use(requireAuth);

// 📝 POST /api/trading/order - Créer un ordre AVEC INTÉGRATION BLOCKCHAIN
router.post('/order', async (req, res) => {
  try {
    const { pair, type, quantity, price } = req.body;
    const userId = req.user.id;
    const userAddress = req.user.address;

    // Validation des données
    if (!pair || !type || !quantity || !price) {
      return res.status(400).json({
        error: 'Missing required fields: pair, type, quantity, price'
      });
    }

    if (!userAddress) {
      return res.status(400).json({
        error: 'User address not found. Please reconnect your wallet.'
      });
    }

    console.log(`🎯 NEW BLOCKCHAIN ORDER: ${type} ${quantity} ${pair} @ ${price}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   User Address: ${userAddress}`);

    // Extraire le symbole de l'asset de la paire (ex: CLV/TRG -> CLV)
    const [assetSymbol] = pair.split('/');
    const upperAssetSymbol = assetSymbol.toUpperCase();
    
    // 🆕 NOUVEAU - Vérifier balances blockchain réelles
    try {
      const realBalance = await vaultService.getTokenBalance(userAddress, upperAssetSymbol);
      console.log(`💰 Real blockchain balance: ${realBalance} ${upperAssetSymbol}`);

      if (type.toUpperCase() === 'SELL' && realBalance < parseFloat(quantity)) {
        return res.status(400).json({
          success: false,
          error: `Insufficient blockchain balance: ${realBalance} ${upperAssetSymbol} (required: ${quantity})`
        });
      }
    } catch (error) {
      console.error('❌ Error checking blockchain balance:', error);
      return res.status(500).json({
        success: false,
        error: `Failed to verify blockchain balance: ${error.message}`
      });
    }

    // 🆕 NOUVEAU - Pour SELL orders, transférer assets vers vault AVANT ordre
    let transferResult = null;
    if (type.toUpperCase() === 'SELL') {
      try {
        console.log(`🏦 Transferring ${quantity} ${upperAssetSymbol} to vault...`);
        
        transferResult = await vaultService.transferToVault(
          userAddress, 
          upperAssetSymbol, 
          parseFloat(quantity),
          'SELL'
        );
        
        console.log('✅ Assets transferred to vault:', transferResult.txHash);
        
      } catch (error) {
        console.error('❌ Vault transfer failed:', error);
        return res.status(400).json({
          success: false,
          error: `Vault transfer failed: ${error.message}`,
          hint: error.message.includes('allowance') ? 
            'Please approve tokens in MetaMask first' : 
            'Check your wallet connection and try again'
        });
      }
    }

    // Créer ordre en DB (logique existante)
    const order = await tradingService.createOrder(userId, {
      assetSymbol: upperAssetSymbol,
      type: type.toUpperCase(),
      price: parseFloat(price),
      quantity: parseFloat(quantity)
    });

    // 🆕 NOUVEAU - Matching avec vraies transactions blockchain
    try {
      await tradingService.matchOrdersWithBlockchain(order.id);
      console.log(`🔄 Order matching completed for order ${order.id}`);
    } catch (error) {
      console.error('❌ Matching failed, but order created:', error);
      // On ne fait pas échouer la requête si le matching échoue
    }

    // Réponse avec informations blockchain
    res.status(201).json({
      status: 'OK',
      message: 'Order created with blockchain integration',
      order: {
        id: order.id,
        type: order.type,
        assetSymbol: order.asset.symbol,
        price: order.price,
        quantity: order.quantity,
        remaining: order.remaining,
        status: order.status,
        createdAt: order.createdAt
      },
      blockchain: {
        confirmed: type.toUpperCase() === 'SELL',
        txHash: transferResult?.txHash || null,
        blockNumber: transferResult?.blockNumber || null,
        gasUsed: transferResult?.gasUsed || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error creating blockchain order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order with blockchain integration',
      message: error.message
    });
  }
});

// 📊 GET /api/trading/stats - Statistiques de trading
router.get('/stats', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const totalOrders = await prisma.order.count();
    const totalTrades = await prisma.trade.count();
    const activeOrders = await prisma.order.count({
      where: { status: { in: ['OPEN', 'PARTIALLY_FILLED'] } }
    });

    await prisma.$disconnect();

    res.json({
      status: 'OK',
      stats: { 
        totalOrders, 
        totalTrades, 
        activeOrders, 
        totalVolume: '0.00' 
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur stats:', error);
    res.status(500).json({ 
      error: 'Failed to get stats', 
      message: error.message 
    });
  }
});

// 📋 GET /api/trading/orders - Mes ordres
router.get('/orders', async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await tradingService.getUserOrders(userId);

    res.json({
      status: 'OK',
      orders,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting orders:', error);
    res.status(500).json({
      error: 'Failed to get orders',
      message: error.message
    });
  }
});

// 💱 GET /api/trading/trades - Mes trades
router.get('/trades', async (req, res) => {
  try {
    const userId = req.user.id;
    const trades = await tradingService.getUserTrades(userId);

    res.json({
      status: 'OK',
      trades,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting trades:', error);
    res.status(500).json({
      error: 'Failed to get trades',
      message: error.message
    });
  }
});

// ❌ DELETE /api/trading/order/:id - Annuler un ordre
router.delete('/order/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await tradingService.cancelOrder(id, userId);

    res.json({
      status: 'OK',
      message: 'Order cancelled successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    res.status(500).json({
      error: 'Failed to cancel order',
      message: error.message
    });
  }
});

// 📖 GET /api/trading/orderbook/:pair - Order book
router.get('/orderbook/:pair', async (req, res) => {
  try {
    const { pair } = req.params;
    console.log(`📖 Requête orderbook: ${pair}`);
    res.json({
      status: 'OK',
      orderBook: { 
        pair, 
        baseToken: pair.split('/')[0], 
        quoteToken: pair.split('/')[1],
        buyOrders: [], 
        sellOrders: [], 
        lastUpdate: new Date().toISOString() 
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur orderbook:', error);
    res.status(500).json({ error: 'Failed to get orderbook' });
  }
});

// 🆕 NOUVEAU - GET /api/trading/vault-balances - Balances dans le vault
router.get('/vault-balances', async (req, res) => {
  try {
    const userAddress = req.user.address;
    
    if (!userAddress) {
      return res.status(400).json({
        error: 'User address not found'
      });
    }

    const vaultBalances = await vaultService.getVaultBalances(userAddress);
    
    res.json({
      status: 'OK',
      vaultBalances,
      userAddress,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting vault balances:', error);
    res.status(500).json({
      error: 'Failed to get vault balances',
      message: error.message
    });
  }
});

module.exports = router;
