const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const unifiedBalanceService = require('../services/unifiedBalanceService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// POST /api/trading/order/:symbol - SCHÉMA EXACT
router.post('/order/:symbol', requireAuth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { type, quantity, price, fromVault } = req.body;
    const userId = req.user.id;
    const userAddress = req.user.address;

    console.log(`🎯 NEW BLOCKCHAIN ORDER: ${type} ${quantity} ${symbol} @ ${price}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   From Vault: ${fromVault || false}`);

    const quantityFloat = parseFloat(quantity);
    const priceFloat = parseFloat(price);

    // Vérification des balances
    if (type === 'SELL') {
      if (fromVault) {
        const vaultBalance = await unifiedBalanceService.getVaultBalance(userAddress, symbol);
        console.log(`✅ Vault balance verified: ${vaultBalance} ${symbol}`);
        
        if (vaultBalance < quantityFloat) {
          return res.status(400).json({
            status: 'ERROR',
            error: `Insufficient vault balance: ${vaultBalance}/${quantity} ${symbol}`
          });
        }
      } else {
        const walletBalance = await unifiedBalanceService.getWalletBalance(userAddress, symbol);
        if (walletBalance < quantityFloat) {
          return res.status(400).json({
            status: 'ERROR', 
            error: `Insufficient wallet balance: ${walletBalance}/${quantity} ${symbol}`
          });
        }
      }
    }

    // Obtenir l'asset
    const asset = await prisma.asset.findUnique({
      where: { symbol: symbol.toUpperCase() }
    });

    if (!asset) {
      return res.status(400).json({
        status: 'ERROR',
        error: `Asset ${symbol} not found`
      });
    }

    // ✅ CRÉER ORDRE SELON SCHÉMA EXACT
    const order = await prisma.order.create({
      data: {
        userId,
        assetId: asset.id,
        type: type.toUpperCase(), // BUY ou SELL
        price: priceFloat.toString(),
        quantity: quantityFloat.toString(),
        remaining: quantityFloat.toString(),
        filled: '0',
        status: 'OPEN' // ✅ Enum OrderStatus par défaut
        // ❌ PAS de fees (pas dans le schéma)
        // ❌ PAS de createdAt/updatedAt (auto-générés)
      }
    });

    console.log(`✅ Order created successfully: ID ${order.id}`);

    res.json({
      status: 'OK',
      message: 'Order created successfully',
      order: {
        id: order.id,
        type: order.type,
        quantity: order.quantity,
        price: order.price,
        remaining: order.remaining,
        status: order.status
      }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

console.log('✅ TRADING ROUTES (Schema Exact): POST /api/trading/order/:symbol');

module.exports = router;
