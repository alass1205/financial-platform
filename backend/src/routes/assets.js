const express = require('express');
const router = express.Router();

// GET /api/assets/:symbol - Informations d'un asset
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Validation du symbol
    const validSymbols = ['TRG', 'CLV', 'ROO', 'GOV'];
    if (!validSymbols.includes(symbol.toUpperCase())) {
      return res.status(404).json({ error: 'Asset non trouvé' });
    }
    
    // Informations statiques des assets (selon cahier des charges)
    const assetInfo = {
      'TRG': {
        symbol: 'TRG',
        name: 'Triangle Coin',
        type: 'STABLECOIN',
        description: 'Stablecoin de base de la plateforme',
        defaultPrice: 1,
        decimals: 18,
        totalSupply: '4000'
      },
      'CLV': {
        symbol: 'CLV',
        name: 'Clove Company',
        type: 'SHARE',
        description: 'Actions de Clove Company',
        defaultPrice: 10,
        decimals: 18,
        totalSupply: '100'
      },
      'ROO': {
        symbol: 'ROO', 
        name: 'Rooibos Limited',
        type: 'SHARE',
        description: 'Actions de Rooibos Limited',
        defaultPrice: 10,
        decimals: 18,
        totalSupply: '100'
      },
      'GOV': {
        symbol: 'GOV',
        name: 'Government Bonds',
        type: 'BOND',
        description: 'Obligations gouvernementales',
        defaultPrice: 200,
        decimals: 0,
        totalSupply: '20'
      }
    };
    
    const asset = assetInfo[symbol.toUpperCase()];
    
    res.json({
      success: true,
      data: asset
    });
    
  } catch (error) {
    console.error('Erreur récupération asset:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// GET /api/assets - Liste tous les assets
router.get('/', async (req, res) => {
  try {
    const assets = [
      {
        symbol: 'TRG',
        name: 'Triangle Coin',
        type: 'STABLECOIN',
        defaultPrice: 1
      },
      {
        symbol: 'CLV',
        name: 'Clove Company', 
        type: 'SHARE',
        defaultPrice: 10
      },
      {
        symbol: 'ROO',
        name: 'Rooibos Limited',
        type: 'SHARE', 
        defaultPrice: 10
      },
      {
        symbol: 'GOV',
        name: 'Government Bonds',
        type: 'BOND',
        defaultPrice: 200
      }
    ];
    
    res.json({
      success: true,
      data: assets
    });
    
  } catch (error) {
    console.error('Erreur liste assets:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

module.exports = router;
