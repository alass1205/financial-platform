// Service pour récupérer dynamiquement les adresses de contrats
class ContractService {
  constructor() {
    this.contracts = null;
    this.isLoaded = false;
    this.API_BASE = 'http://localhost:3001';
  }

  // Charger les adresses depuis le backend
  async loadContracts() {
    if (this.isLoaded && this.contracts) {
      return this.contracts;
    }

    try {
      console.log('🔄 Loading contract addresses from backend...');
      
      const response = await fetch(`${this.API_BASE}/api/contracts`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load contracts');
      }
      
      this.contracts = data.contracts;
      this.network = data.network;
      this.isLoaded = true;
      
      console.log('✅ Contract addresses loaded:', this.contracts);
      console.log('🌐 Network config:', this.network);
      
      return this.contracts;
      
    } catch (error) {
      console.error('❌ Error loading contract addresses:', error);
      
      // Fallback vers des adresses par défaut si l'API échoue
      console.log('⚠️  Using fallback contract addresses');
      
      this.contracts = {
        TRG: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        CLV: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        ROO: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        GOV: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
        VAULT: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
      };
      
      this.network = {
        rpcUrl: 'http://127.0.0.1:8546',
        chainId: 31337
      };
      
      this.isLoaded = true;
      return this.contracts;
    }
  }

  // Obtenir une adresse spécifique
  async getContract(symbol) {
    const contracts = await this.loadContracts();
    return contracts[symbol.toUpperCase()];
  }

  // Obtenir toutes les adresses
  async getAllContracts() {
    return await this.loadContracts();
  }

  // Obtenir la configuration réseau
  async getNetworkConfig() {
    await this.loadContracts();
    return this.network;
  }

  // Recharger les adresses (utile après redéploiement)
  async reloadContracts() {
    this.isLoaded = false;
    this.contracts = null;
    return await this.loadContracts();
  }

  // Vérifier si une adresse est valide
  isValidAddress(address) {
    return address && /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

// Instance singleton
const contractService = new ContractService();

export default contractService;
