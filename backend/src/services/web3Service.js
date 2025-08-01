const { ethers } = require('ethers');

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Connexion au provider Hardhat
      this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_URL || 'http://127.0.0.1:8545');
      
      // Signer avec la clé privée
      this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      
      console.log('🔗 Connected to blockchain');
      console.log('📝 Signer address:', this.signer.address);
      
      // Vérifier la connexion
      const network = await this.provider.getNetwork();
      console.log('🌐 Network:', network.name, 'Chain ID:', network.chainId.toString());
      
      // Initialiser les contrats
      await this.initializeContracts();
      
      this.isInitialized = true;
      console.log('✅ Web3Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Web3Service initialization failed:', error);
      throw error;
    }
  }

  async initializeContracts() {
    try {
      // ABI simplifiés pour les contrats (on prendra les vrais plus tard)
      const erc20ABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "event Transfer(address indexed from, address indexed to, uint256 value)"
      ];

      const erc721ABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function ownerOf(uint256 tokenId) view returns (address)",
        "function getBondDetails(uint256 tokenId) view returns (uint256, uint256, uint256, uint256, uint256, address, bool, uint256, bool)",
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
      ];

      // Initialiser les contrats
      this.contracts.TRG = new ethers.Contract(
        process.env.TRG_CONTRACT,
        erc20ABI,
        this.provider
      );

      this.contracts.CLV = new ethers.Contract(
        process.env.CLV_CONTRACT,
        erc20ABI,
        this.provider
      );

      this.contracts.ROO = new ethers.Contract(
        process.env.ROO_CONTRACT,
        erc20ABI,
        this.provider
      );

      this.contracts.GOV = new ethers.Contract(
        process.env.GOV_CONTRACT,
        erc721ABI,
        this.provider
      );

      console.log('📄 Contracts initialized:');
      console.log('   TRG:', process.env.TRG_CONTRACT);
      console.log('   CLV:', process.env.CLV_CONTRACT);
      console.log('   ROO:', process.env.ROO_CONTRACT);
      console.log('   GOV:', process.env.GOV_CONTRACT);

    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
      throw error;
    }
  }

  // Obtenir les informations d'un token
  async getTokenInfo(symbol) {
    try {
      const contract = this.contracts[symbol];
      if (!contract) throw new Error(`Contract ${symbol} not found`);

      const [name, tokenSymbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        symbol === 'GOV' ? Promise.resolve(0) : contract.decimals(),
        contract.totalSupply()
      ]);

      return {
        name,
        symbol: tokenSymbol,
        decimals: decimals.toString(),
        totalSupply: totalSupply.toString(),
        contract: await contract.getAddress()
      };
    } catch (error) {
      console.error(`❌ Error getting token info for ${symbol}:`, error);
      throw error;
    }
  }

  // Obtenir la balance d'un utilisateur
  async getBalance(userAddress, symbol) {
    try {
      const contract = this.contracts[symbol];
      if (!contract) throw new Error(`Contract ${symbol} not found`);

      const balance = await contract.balanceOf(userAddress);
      return {
        symbol,
        balance: balance.toString(),
        formatted: symbol === 'GOV' ? balance.toString() : ethers.formatEther(balance)
      };
    } catch (error) {
      console.error(`❌ Error getting balance for ${userAddress} ${symbol}:`, error);
      throw error;
    }
  }

  // Obtenir toutes les balances d'un utilisateur
  async getAllBalances(userAddress) {
    try {
      const symbols = ['TRG', 'CLV', 'ROO', 'GOV'];
      const balances = await Promise.all(
        symbols.map(symbol => this.getBalance(userAddress, symbol))
      );

      return balances.reduce((acc, balance) => {
        acc[balance.symbol] = balance;
        return acc;
      }, {});
    } catch (error) {
      console.error(`❌ Error getting all balances for ${userAddress}:`, error);
      throw error;
    }
  }

  // Vérifier si une adresse est valide
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  // Obtenir les détails du réseau
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        name: network.name,
        chainId: network.chainId.toString(),
        blockNumber,
        isConnected: true
      };
    } catch (error) {
      console.error('❌ Error getting network info:', error);
      return { isConnected: false, error: error.message };
    }
  }
}

// Singleton instance
const web3Service = new Web3Service();

module.exports = web3Service;
