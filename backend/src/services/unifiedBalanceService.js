const { ethers } = require('ethers');
require('dotenv').config(); // ✅ FORCE LE CHARGEMENT DU .ENV

class UnifiedBalanceService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_URL || 'http://127.0.0.1:8546');
    
    // ✅ ADRESSES DEPUIS .ENV (avec fallbacks)
    this.contracts = {
      TRG: process.env.TRG_CONTRACT || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      CLV: process.env.CLV_CONTRACT || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      ROO: process.env.ROO_CONTRACT || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      GOV: process.env.GOV_CONTRACT || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      VAULT: process.env.VAULT_CONTRACT || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
    };

    // ABI minimal
    this.tokenABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)"
    ];

    this.vaultABI = [
      "function getUserTokenBalance(address user, address token) view returns (uint256)"
    ];

    console.log('✅ UnifiedBalanceService initialized with contracts:', this.contracts);
  }

  // ✅ Fonction pour balances wallet (blockchain directe)
  async getTokenBalance(userAddress, symbol) {
    try {
      const contractAddress = this.contracts[symbol];
      if (!contractAddress) {
        throw new Error(`No contract address for ${symbol}`);
      }

      const contract = new ethers.Contract(contractAddress, this.tokenABI, this.provider);
      const balance = await contract.balanceOf(userAddress);

      return {
        raw: balance.toString(),
        formatted: ethers.formatEther(balance),
        symbol,
        address: contractAddress
      };

    } catch (error) {
      console.error(`❌ Error getting ${symbol} balance:`, error.message);
      return { raw: '0', formatted: '0.0', symbol, address: contractAddress || '' };
    }
  }

  // ✅ Fonction pour balances vault
  async getVaultTokenBalance(userAddress, symbol) {
    try {
      if (!this.contracts.VAULT) {
        throw new Error('Vault contract address not found');
      }

      const tokenAddress = this.contracts[symbol];
      if (!tokenAddress) {
        throw new Error(`No token address for ${symbol}`);
      }

      const vaultContract = new ethers.Contract(this.contracts.VAULT, this.vaultABI, this.provider);
      const balance = await vaultContract.getUserTokenBalance(userAddress, tokenAddress);

      return {
        raw: balance.toString(),
        formatted: ethers.formatEther(balance),
        symbol
      };

    } catch (error) {
      console.error(`❌ Error getting vault ${symbol} balance:`, error.message);
      return { raw: '0', formatted: '0.0', symbol };
    }
  }

  // ✅ Fonction principale - toutes les balances
  async getAllBalances(userAddress) {
    try {
      console.log(`🔄 Getting all balances for: ${userAddress}`);

      const symbols = ['TRG', 'CLV', 'ROO'];
      const walletBalances = {};
      const vaultBalances = {};

      // Paralléliser les requêtes
      const walletPromises = symbols.map(symbol => this.getTokenBalance(userAddress, symbol));
      const vaultPromises = symbols.map(symbol => this.getVaultTokenBalance(userAddress, symbol));

      const [walletResults, vaultResults] = await Promise.all([
        Promise.all(walletPromises),
        Promise.all(vaultPromises)
      ]);

      // Formater les résultats
      symbols.forEach((symbol, index) => {
        walletBalances[symbol] = walletResults[index];
        vaultBalances[symbol] = vaultResults[index];
      });

      console.log('✅ All balances retrieved successfully');

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

  // ✅ BONUS - Fonction pour trading routes
  async getWalletBalance(userAddress, symbol) {
    const result = await this.getTokenBalance(userAddress, symbol);
    return parseFloat(result.formatted);
  }

  async getVaultBalance(userAddress, symbol) {
    const result = await this.getVaultTokenBalance(userAddress, symbol);
    return parseFloat(result.formatted);
  }
}

module.exports = new UnifiedBalanceService();
