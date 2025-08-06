const express = require('express');
const router = express.Router();
const tradingService = require('../services/tradingService');
const vaultService = require('../services/vaultService');
const { requireAuth } = require('../middleware/auth'); // ✅ CORRIGÉ

// ✅ 6. Nouvelle route ordre par symbol avec intégration MetaMask
router.post('/order/:symbol', requireAuth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { type, quantity, price } = req.body;
    const userId = req.user.id;
    const userAddress = req.user.address;

    console.log(`🎯 NEW BLOCKCHAIN ORDER: ${type} ${quantity} ${symbol.toUpperCase()}/TRG @ ${price}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   User Address: ${userAddress}`);

    // Validation
    if (!type || !quantity || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, quantity, price'
      });
    }

    const upperSymbol = symbol.toUpperCase();
    const orderType = type.toUpperCase();
    const orderQuantity = parseFloat(quantity);
    const orderPrice = parseFloat(price);

    // Pour les ordres SELL, vérifier la balance et l'approbation
    if (orderType === 'SELL') {
      try {
        // Vérifier balance wallet
        const walletBalance = await vaultService.getTokenBalance(userAddress, upperSymbol);
        console.log(`💰 Real blockchain balance: ${walletBalance} ${upperSymbol}`);
        
        if (walletBalance < orderQuantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient ${upperSymbol} balance: ${walletBalance}/${orderQuantity} required`,
            balance: walletBalance,
            required: orderQuantity
          });
        }

        // Vérifier approbation
        console.log(`🏦 Transferring ${orderQuantity} ${upperSymbol} to vault...`);
        const transferResult = await vaultService.transferToVault(
          userAddress, 
          upperSymbol, 
          orderQuantity, 
          orderType
        );
        
        console.log(`✅ Assets transferred to vault: ${transferResult.txHash}`);

      } catch (vaultError) {
        console.error('❌ Vault transfer error:', vaultError);
        return res.status(400).json({
          success: false,
          error: 'Vault transfer failed',
          message: vaultError.message,
          suggestion: vaultError.message.includes('allowance') ? 
            'Please approve tokens in MetaMask first' : 
            'Check your wallet connection and try again'
        });
      }
    }

    // Créer ordre en DB
    const order = await tradingService.createOrder(userId, {
      assetSymbol: upperSymbol,
      type: orderType,
      price: orderPrice,
      quantity: orderQuantity
    });

    // Matching avec blockchain
    try {
      await tradingService.matchOrdersWithBlockchain(order.id);
      console.log(`🔄 Order matching completed for order ${order.id}`);
    } catch (error) {
      console.error('❌ Matching failed, but order created:', error);
    }

    res.status(201).json({
      success: true,
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
        confirmed: orderType === 'SELL',
        userAddress,
        mode: 'REAL_BLOCKCHAIN'
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

module.exports = router;
