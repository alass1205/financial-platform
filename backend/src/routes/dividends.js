const express = require('express');
const { ethers } = require('ethers');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Helper pour créer une connexion au contrat
async function getShareContract(symbol) {
  const contractAddress = process.env[`${symbol.toUpperCase()}_CONTRACT`];
  
  if (!contractAddress) {
    throw new Error(`${symbol} contract not configured`);
  }

  // Utiliser directement ethers avec le provider du backend
  const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_URL);
  const contract = new ethers.Contract(
    contractAddress,
    [
      // ABI minimal pour les fonctions dividendes
      "function availableDividends(address) view returns (uint256)",
      "function getShareInfo() view returns (string, string, uint256, uint256, address)",
      "function dividendsPerShare() view returns (uint256)",
      "function balanceOf(address) view returns (uint256)",
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function totalSupply() view returns (uint256)",
      "function owner() view returns (address)",
      "function distributeDividends(uint256)",
      "function claimDividends()",
      "event DividendsDistributed(uint256 amount, uint256 perShare)",
      "event DividendClaimed(address indexed shareholder, uint256 amount)"
    ],
    provider
  );

  return contract;
}

/**
 * 💎 ROUTES DIVIDENDES - VERSION CORRIGÉE
 */

// GET /api/dividends/available/:symbol/:address - Voir dividendes disponibles
router.get('/available/:symbol/:address', async (req, res) => {
  try {
    const { symbol, address } = req.params;
    const symbolUpper = symbol.toUpperCase();

    if (!['CLV', 'ROO'].includes(symbolUpper)) {
      return res.status(400).json({ error: 'Symbol must be CLV or ROO' });
    }

    console.log(`🔍 Checking dividends for ${symbolUpper} for user ${address}`);

    const contract = await getShareContract(symbolUpper);
    
    // Obtenir les dividendes disponibles
    const availableDividends = await contract.availableDividends(address);
    const userBalance = await contract.balanceOf(address);
    const shareInfo = await contract.getShareInfo();
    const dividendsPerShare = await contract.dividendsPerShare();
    
    const [name, symbolContract, totalSupply, totalDividendsDistributed, dividendTokenAddr] = shareInfo;

    res.json({
      success: true,
      data: {
        symbol: symbolUpper,
        name,
        contractAddress: await contract.getAddress(),
        userAddress: address,
        availableDividends: ethers.formatEther(availableDividends),
        availableDividendsWei: availableDividends.toString(),
        userBalance: ethers.formatEther(userBalance),
        totalSupply: ethers.formatEther(totalSupply),
        totalDividendsDistributed: ethers.formatEther(totalDividendsDistributed),
        dividendsPerShare: ethers.formatEther(dividendsPerShare),
        dividendTokenAddress: dividendTokenAddr
      }
    });

  } catch (error) {
    console.error('❌ Error getting available dividends:', error);
    res.status(500).json({ 
      error: 'Failed to get available dividends',
      details: error.message 
    });
  }
});

// GET /api/dividends/info/:symbol - Informations générales
router.get('/info/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const symbolUpper = symbol.toUpperCase();

    if (!['CLV', 'ROO'].includes(symbolUpper)) {
      return res.status(400).json({ error: 'Symbol must be CLV or ROO' });
    }

    console.log(`ℹ️  Getting info for ${symbolUpper}`);

    const contract = await getShareContract(symbolUpper);
    
    const shareInfo = await contract.getShareInfo();
    const dividendsPerShare = await contract.dividendsPerShare();
    const owner = await contract.owner();
    
    const [name, symbolContract, totalSupply, totalDividendsDistributed, dividendTokenAddress] = shareInfo;

    res.json({
      success: true,
      data: {
        symbol: symbolUpper,
        name,
        contractAddress: await contract.getAddress(),
        owner,
        totalSupply: ethers.formatEther(totalSupply),
        totalDividendsDistributed: ethers.formatEther(totalDividendsDistributed),
        dividendsPerShare: ethers.formatEther(dividendsPerShare),
        dividendTokenAddress,
        hasDividends: totalDividendsDistributed > 0n,
        dividendTokenSymbol: 'TRG'
      }
    });

  } catch (error) {
    console.error('❌ Error getting dividend info:', error);
    res.status(500).json({ 
      error: 'Failed to get dividend info',
      details: error.message 
    });
  }
});

// GET /api/dividends/history/:symbol - Historique des dividendes
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const symbolUpper = symbol.toUpperCase();

    if (!['CLV', 'ROO'].includes(symbolUpper)) {
      return res.status(400).json({ error: 'Symbol must be CLV or ROO' });
    }

    console.log(`📊 Getting dividend history for ${symbolUpper}`);

    const contract = await getShareContract(symbolUpper);
    
    // Récupérer les events de distribution
    const distributionFilter = contract.filters.DividendsDistributed();
    const distributionEvents = await contract.queryFilter(distributionFilter, 0);

    const distributions = distributionEvents.map(event => ({
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      amount: ethers.formatEther(event.args[0]),
      amountWei: event.args[0].toString(),
      perShare: ethers.formatEther(event.args[1]),
      perShareWei: event.args[1].toString()
    }));

    // Events de réclamation
    const claimFilter = contract.filters.DividendClaimed();
    const claimEvents = await contract.queryFilter(claimFilter, 0);
    
    const claims = claimEvents.map(event => ({
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      shareholder: event.args[0],
      amount: ethers.formatEther(event.args[1]),
      amountWei: event.args[1].toString()
    }));

    res.json({
      success: true,
      data: {
        symbol: symbolUpper,
        contractAddress: await contract.getAddress(),
        totalDistributions: distributions.length,
        distributions,
        totalClaims: claims.length,
        claims
      }
    });

  } catch (error) {
    console.error('❌ Error getting dividend history:', error);
    res.status(500).json({ 
      error: 'Failed to get dividend history',
      details: error.message 
    });
  }
});

module.exports = router;
