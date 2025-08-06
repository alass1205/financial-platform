const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const unifiedBalanceService = require('../services/unifiedBalanceService');

// GET /api/trading/balances - Service unifié
router.get('/balances', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userAddress = req.user.address;

    console.log(`📊 Getting balances for user: ${userId} (${userAddress})`);

    // ✅ Utiliser le service unifié
    const result = await unifiedBalanceService.getAllBalances(userAddress);

    console.log('✅ Unified service response ready');

    res.json(result);

  } catch (error) {
    console.error('❌ Error getting balances:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ VAULT ROUTES (Unified Service): GET /api/trading/balances');

module.exports = router;
