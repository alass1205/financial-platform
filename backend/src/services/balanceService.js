const { ethers } = require('ethers');

class BalanceService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_URL || 'http://127.0.0.1:8546');
    
    // Adresses directes depuis les variables d'environnement
    this.contracts = {
      TRG: process.env.TRG_CONTRACT,
      CLV: process.env.CLV_CONTRACT,
      ROO: process.env.ROO_CONTRACT,
      GOV: process.env.GOV_CONTRACT,
      VAULT: process.env.VAULT_CONTRACT
    };

    // ABI minimal pour lire les balances
    this.tokenABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)"
    ];

    console.log('✅ BalanceService initialized with contracts:', this.contracts);
  }

  // Obtenir la balance d'un token spécifique
  async getTokenBalance(userAddress, symbol) {
    try {
      const contractAddress = this.contracts[symbol];
      if (!contractAddress) {
        console.log(`⚠️ No contract address for ${symbol}`);
        return { raw: '0', formatted: '0.0', symbol, address: '' };
      }

      console.log(`🔍 Getting ${symbol} balance for ${userAddress} at ${contractAddress}`);

      const contract = new ethers.Contract(contractAddress, this.tokenABI, this.provider);
      const balance = await contract.balanceOf(userAddress);

      const result = {
        raw: balance.toString(),
        formatted: ethers.formatEther(balance),
        symbol,
        address: contractAddress
      };

      console.log(`💰 ${symbol} balance:`, result.formatted);
      return result;

    } catch (error) {
      console.error(`❌ Error getting ${symbol} balance:`, error.message);
      return { raw: '0', formatted: '0.0', symbol, address: this.contracts[symbol] || '' };
    }
  }

  // Obtenir toutes les balances wallet
  async getWalletBalances(userAddress) {
    console.log(`📊 Getting wallet balances for: ${userAddress}`);
    
    const balances = {};
    const symbols = ['TRG', 'CLV', 'ROO'];

    for (const symbol of symbols) {
      balances[symbol] = await this.getTokenBalance(userAddress, symbol);
    }

    console.log('✅ Wallet balances retrieved:', Object.keys(balances));
    return balances;
  }

  // Obtenir les balances vault (pour l'instant à 0)
  async getVaultBalances(userAddress) {
    console.log(`🏦 Getting vault balances for: ${userAddress}`);
    
    const balances = {};
    const symbols = ['TRG', 'CLV', 'ROO'];

    // Pour l'instant, retourner 0 pour toutes les balances vault
    // TODO: Implémenter la lecture du vault contract
    for (const symbol of symbols) {
      balances[symbol] = {
        raw: '0',
        formatted: '0.0',
        symbol
      };
    }

    console.log('✅ Vault balances retrieved (placeholder):', Object.keys(balances));
    return balances;
  }

  // Fonction principale
  async getAllBalances(userAddress) {
    try {
      console.log(`🔄 Getting all balances for: ${userAddress}`);

      const [walletBalances, vaultBalances] = await Promise.all([
        this.getWalletBalances(userAddress),
        this.getVaultBalances(userAddress)
      ]);

      return {
        success: true,
        userAddress,
        walletBalances,
        vaultBalances
      };

    } catch (error) {
      console.error('❌ Error getting all balances:', error);
      throw error;
    }
  }
}

module.exports = new BalanceService();
