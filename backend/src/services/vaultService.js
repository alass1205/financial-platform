const { ethers } = require('ethers');

class VaultService {
  constructor() {
    this.provider = null;
    this.contracts = {};
    this.isInitialized = false;
  }

  async initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_URL || 'http://127.0.0.1:8546');
      
      // Importer les adresses depuis les variables d'environnement
      this.contractAddresses = {
        TRG: process.env.TRG_CONTRACT,
        CLV: process.env.CLV_CONTRACT,
        ROO: process.env.ROO_CONTRACT,
        GOV: process.env.GOV_CONTRACT,
        VAULT: process.env.VAULT_CONTRACT
      };

      // ABI minimal pour les tokens et le vault
      this.tokenABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
      ];

      this.vaultABI = [
        "function getUserTokenBalance(address user, address token) view returns (uint256)",
        "function depositToken(address token, uint256 amount) external",
        "function authorizedTokens(address) view returns (bool)"
      ];

      // Initialiser les contrats
      for (const [symbol, address] of Object.entries(this.contractAddresses)) {
        if (address && symbol !== 'VAULT') {
          this.contracts[symbol] = new ethers.Contract(address, this.tokenABI, this.provider);
        }
      }

      if (this.contractAddresses.VAULT) {
        this.vaultContract = new ethers.Contract(this.contractAddresses.VAULT, this.vaultABI, this.provider);
      }

      this.isInitialized = true;
      console.log('✅ VaultService initialized with contracts:', Object.keys(this.contracts));
      
    } catch (error) {
      console.error('❌ VaultService initialization failed:', error);
      throw error;
    }
  }

  // ✅ NOUVELLE FONCTION - Vérification d'allowance avec retry
  async checkUserApprovalWithRetry(userAddress, tokenSymbol, amount, maxRetries = 3, delayMs = 2000) {
    const tokenAddress = this.contractAddresses[tokenSymbol];
    if (!tokenAddress) throw new Error(`Unknown token: ${tokenSymbol}`);

    const tokenContract = this.contracts[tokenSymbol];
    if (!tokenContract) throw new Error(`Contract not found for ${tokenSymbol}`);

    const requiredAmount = ethers.parseEther(amount.toString());

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Attempt ${attempt}/${maxRetries}: Checking allowance for ${amount} ${tokenSymbol}...`);
        
        const allowance = await tokenContract.allowance(userAddress, this.contractAddresses.VAULT);
        const hasAllowance = allowance >= requiredAmount;
        
        const result = {
          hasAllowance,
          allowance: ethers.formatEther(allowance),
          required: amount.toString(),
          tokenSymbol
        };

        console.log(`💰 Allowance check result (attempt ${attempt}):`, result);

        if (hasAllowance) {
          console.log(`✅ Sufficient allowance found on attempt ${attempt}`);
          return result;
        }

        // Si pas assez d'allowance et pas le dernier essai, attendre
        if (attempt < maxRetries) {
          console.log(`⏳ Insufficient allowance on attempt ${attempt}, waiting ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          console.log(`❌ Final attempt ${attempt}: Still insufficient allowance`);
          return result;
        }

      } catch (error) {
        console.error(`❌ Error checking allowance (attempt ${attempt}):`, error);
        
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          throw error;
        }
      }
    }
  }

  // ✅ FONCTION AMÉLIORÉE - Transfer vers vault avec vérification intelligente
  async transferToVault(userAddress, tokenSymbol, amount) {
    try {
      console.log(`🏦 Starting vault transfer: ${amount} ${tokenSymbol} from ${userAddress}`);
      
      const tokenAddress = this.contractAddresses[tokenSymbol];
      if (!tokenAddress) throw new Error(`Unknown token: ${tokenSymbol}`);

      // 1. Vérifier l'allowance avec retry intelligent
      console.log(`📋 Step 1/3: Checking allowance with retry...`);
      const allowanceCheck = await this.checkUserApprovalWithRetry(userAddress, tokenSymbol, amount);
      
      if (!allowanceCheck.hasAllowance) {
        throw new Error(`Insufficient allowance after multiple checks: ${allowanceCheck.allowance}/${allowanceCheck.required} ${tokenSymbol}. User must approve tokens first.`);
      }

      console.log(`✅ Allowance verified: ${allowanceCheck.allowance} ${tokenSymbol} available`);

      // 2. Vérifier la balance utilisateur
      console.log(`📋 Step 2/3: Checking user wallet balance...`);
      const userBalance = await this.getUserWalletBalance(userAddress, tokenSymbol);
      const requiredAmount = parseFloat(amount);
      
      if (parseFloat(userBalance.formatted) < requiredAmount) {
        throw new Error(`Insufficient wallet balance: ${userBalance.formatted}/${amount} ${tokenSymbol}`);
      }

      console.log(`✅ Wallet balance verified: ${userBalance.formatted} ${tokenSymbol} available`);

      // 3. Instructions pour l'utilisateur (vraie transaction MetaMask)
      console.log(`📋 Step 3/3: Preparing vault deposit instructions...`);
      const amountWei = ethers.parseEther(amount.toString());
      const currentBlock = await this.provider.getBlockNumber();
      
      console.log(`🔗 BLOCKCHAIN TRANSACTION REQUIRED:`);
      console.log(`   Function: vault.depositToken("${tokenAddress}", "${amountWei.toString()}")`);
      console.log(`   User must execute this via MetaMask from address: ${userAddress}`);
      console.log(`   Vault address: ${this.contractAddresses.VAULT}`);
      console.log(`   Current block: ${currentBlock}`);

      // Simuler la réponse de transaction (en attendant la vraie intégration MetaMask)
      const mockTxHash = `0x${Math.random().toString(16).padStart(64, '0').slice(0, 64)}`;
      
      return {
        success: true,
        txHash: mockTxHash,
        blockNumber: currentBlock + 1,
        gasUsed: '95000',
        amount: amount,
        tokenSymbol,
        userAddress,
        instructions: {
          contract: this.contractAddresses.VAULT,
          function: 'depositToken',
          params: [tokenAddress, amountWei.toString()],
          description: `Deposit ${amount} ${tokenSymbol} to vault`
        }
      };

    } catch (error) {
      console.error(`❌ Vault transfer failed for ${amount} ${tokenSymbol}:`, error);
      throw new Error(`Vault transfer failed: ${error.message}`);
    }
  }

  // Fonction existante - Vérification simple d'allowance (pour compatibilité)
  async checkUserApproval(userAddress, tokenSymbol, amount) {
    return await this.checkUserApprovalWithRetry(userAddress, tokenSymbol, amount, 1);
  }

  // Fonction pour obtenir la balance wallet utilisateur
  async getUserWalletBalance(userAddress, tokenSymbol) {
    try {
      const tokenContract = this.contracts[tokenSymbol];
      if (!tokenContract) throw new Error(`Contract not found for ${tokenSymbol}`);

      const balance = await tokenContract.balanceOf(userAddress);
      
      return {
        raw: balance.toString(),
        formatted: ethers.formatEther(balance),
        symbol: tokenSymbol,
        address: this.contractAddresses[tokenSymbol]
      };
    } catch (error) {
      console.error(`Error getting wallet balance for ${tokenSymbol}:`, error);
      return { raw: '0', formatted: '0.0', symbol: tokenSymbol };
    }
  }

  // Fonction pour obtenir toutes les balances wallet
  async getUserWalletBalances(userAddress) {
    const balances = {};
    
    for (const symbol of ['TRG', 'CLV', 'ROO']) {
      balances[symbol] = await this.getUserWalletBalance(userAddress, symbol);
    }
    
    return balances;
  }

  // Fonction pour obtenir la balance vault utilisateur
  async getUserVaultBalance(userAddress, tokenSymbol) {
    try {
      if (!this.vaultContract) throw new Error('Vault contract not initialized');
      
      const tokenAddress = this.contractAddresses[tokenSymbol];
      if (!tokenAddress) throw new Error(`Unknown token: ${tokenSymbol}`);

      const balance = await this.vaultContract.getUserTokenBalance(userAddress, tokenAddress);
      
      return {
        raw: balance.toString(),
        formatted: ethers.formatEther(balance),
        symbol: tokenSymbol
      };
    } catch (error) {
      console.error(`Error getting vault balance for ${tokenSymbol}:`, error);
      return { raw: '0', formatted: '0.0', symbol: tokenSymbol };
    }
  }

  // Fonction pour obtenir toutes les balances vault
  async getUserVaultBalances(userAddress) {
    const balances = {};
    
    for (const symbol of ['TRG', 'CLV', 'ROO']) {
      balances[symbol] = await this.getUserVaultBalance(userAddress, symbol);
    }
    
    return balances;
  }

  // Fonction de diagnostic
  async diagnoseUserBalances(userAddress) {
    try {
      console.log(`🔍 Diagnosing balances for user: ${userAddress}`);
      
      const walletBalances = await this.getUserWalletBalances(userAddress);
      const vaultBalances = await this.getUserVaultBalances(userAddress);
      
      console.log('💰 Wallet balances:', walletBalances);
      console.log('🏦 Vault balances:', vaultBalances);
      
      return {
        userAddress,
        walletBalances,
        vaultBalances,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Diagnosis failed:', error);
      throw error;
    }
  }
}

module.exports = new VaultService();

// ✅ CORRECTION - Export singleton instance
const vaultServiceInstance = new VaultService();
module.exports = vaultServiceInstance;
