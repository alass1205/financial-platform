const express = require('express');
const router = express.Router();
const web3Service = require("../services/web3Service");
const { requireAuth } = require('../middleware/auth'); // ✅ CORRIGÉ

// ✅ 1. Vérifier approbation utilisateur
router.get('/check-approval/:tokenSymbol/:amount', requireAuth, async (req, res) => {
  try {
    const { tokenSymbol, amount } = req.params;
    const userAddress = req.user.address;

    console.log(`🔍 Checking approval: ${amount} ${tokenSymbol} for ${userAddress}`);

    const approval = await vaultService.checkUserApproval(userAddress, tokenSymbol.toUpperCase(), amount);
    
    res.json({
      success: true,
      canProceed: approval.canProceed,
      userAddress,
      tokenSymbol: tokenSymbol.toUpperCase(),
      amount,
      approval
    });

  } catch (error) {
    console.error('❌ Check approval error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ 2. Instructions MetaMask
router.get('/metamask-instructions/:tokenSymbol/:amount', requireAuth, async (req, res) => {
  try {
    const { tokenSymbol, amount } = req.params;
    const userAddress = req.user.address;

    const instructions = vaultService.generateApprovalInstructions(userAddress, tokenSymbol.toUpperCase(), amount);
    
    res.json({
      success: true,
      userAddress,
      tokenSymbol: tokenSymbol.toUpperCase(),
      amount,
      instructions
    });

  } catch (error) {
    console.error('❌ MetaMask instructions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ 3. Attendre dépôt utilisateur
router.post('/wait-deposit', requireAuth, async (req, res) => {
  try {
    const { tokenSymbol, amount, timeoutMs = 60000 } = req.body;
    const userAddress = req.user.address;

    console.log(`⏰ Starting wait for deposit: ${amount} ${tokenSymbol}`);

    const result = await vaultService.waitForUserDeposit(userAddress, tokenSymbol.toUpperCase(), amount, timeoutMs);
    
    res.json({
      success: true,
      userAddress,
      tokenSymbol: tokenSymbol.toUpperCase(),
      amount,
      deposit: result
    });

  } catch (error) {
    console.error('❌ Wait deposit error:', error);
    res.status(408).json({
      success: false,
      error: error.message,
      timeout: true
    });
  }
});

// ✅ 4. Balances wallet + vault
router.get('/balances', requireAuth, async (req, res) => {
  try {
    const userAddress = req.user.address;

    const [walletBalances, vaultBalances] = await Promise.all([
      web3Service.getAllBalances(userAddress),
      web3Service.getAllBalances(userAddress)
    ]);
    
    res.json({
      success: true,
      userAddress,
      walletBalances,
      vaultBalances
    });

  } catch (error) {
    console.error('❌ Get balances error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ 5. Effectuer retrait
router.post('/withdraw', requireAuth, async (req, res) => {
  try {
    const { tokenSymbol, amount } = req.body;
    const userAddress = req.user.address;

    console.log(`🏧 Processing withdrawal: ${amount} ${tokenSymbol} for ${userAddress}`);

    const result = await vaultService.executeWithdrawal(userAddress, tokenSymbol.toUpperCase(), amount);
    
    res.json({
      success: true,
      userAddress,
      tokenSymbol: tokenSymbol.toUpperCase(),
      amount,
      withdrawal: result
    });

  } catch (error) {
    console.error('❌ Withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
