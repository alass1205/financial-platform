import { ethers } from 'ethers'
import contractService from './contractService'

// ABIs simplifiés pour nos contrats
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
]

const ERC721_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)"
]

class TokenService {
  constructor() {
    this.contracts = {}
    this.contractAddresses = null
  }

  // ✅ NOUVEAU - Initialiser avec adresses dynamiques
  async initializeContracts(provider) {
    try {
      this.provider = provider
      
      // Charger les adresses dynamiquement depuis le backend
      this.contractAddresses = await contractService.getAllContracts()
      
      console.log('🔄 Initializing contracts with dynamic addresses:', this.contractAddresses)
      
      // Initialiser les contrats ERC20 avec adresses dynamiques
      this.contracts.TRG = new ethers.Contract(this.contractAddresses.TRG, ERC20_ABI, provider)
      this.contracts.CLV = new ethers.Contract(this.contractAddresses.CLV, ERC20_ABI, provider)
      this.contracts.ROO = new ethers.Contract(this.contractAddresses.ROO, ERC20_ABI, provider)
      
      // Contrat ERC721 pour les obligations
      this.contracts.GOV = new ethers.Contract(this.contractAddresses.GOV, ERC721_ABI, provider)
      
      console.log('✅ Contrats initialisés avec adresses dynamiques')
      return true
    } catch (error) {
      console.error('❌ Erreur initialisation contrats:', error)
      
      // Fallback vers des adresses par défaut si l'API échoue
      console.log('⚠️  Using fallback contract addresses')
      this.contractAddresses = {
        TRG: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        CLV: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", 
        ROO: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        GOV: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
      }
      
      this.contracts.TRG = new ethers.Contract(this.contractAddresses.TRG, ERC20_ABI, provider)
      this.contracts.CLV = new ethers.Contract(this.contractAddresses.CLV, ERC20_ABI, provider)
      this.contracts.ROO = new ethers.Contract(this.contractAddresses.ROO, ERC20_ABI, provider)
      this.contracts.GOV = new ethers.Contract(this.contractAddresses.GOV, ERC721_ABI, provider)
      
      return true
    }
  }

  // Obtenir les informations d'un token ERC20
  async getTokenInfo(symbol) {
    try {
      const contract = this.contracts[symbol]
      if (!contract) throw new Error(`Token ${symbol} non trouvé`)

      const [name, tokenSymbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ])

      return {
        symbol: tokenSymbol,
        name,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        address: this.contractAddresses[symbol] // ✅ Utiliser adresse dynamique
      }
    } catch (error) {
      console.error(`Erreur info token ${symbol}:`, error)
      return null
    }
  }

  // Obtenir la balance d'un token ERC20
  async getTokenBalance(symbol, address) {
    try {
      const contract = this.contracts[symbol]
      if (!contract) throw new Error(`Token ${symbol} non trouvé`)

      const balance = await contract.balanceOf(address)
      const decimals = await contract.decimals()
      
      return {
        raw: balance.toString(),
        formatted: ethers.formatUnits(balance, decimals),
        decimals: Number(decimals)
      }
    } catch (error) {
      console.error(`Erreur balance ${symbol}:`, error)
      return { raw: "0", formatted: "0", decimals: 18 }
    }
  }

  // Obtenir les informations NFT GOV
  async getNFTInfo(address) {
    try {
      const contract = this.contracts.GOV
      if (!contract) throw new Error('Contrat GOV non trouvé')

      const balance = await contract.balanceOf(address)
      const nftCount = Number(balance)
      
      const nfts = []
      for (let i = 0; i < nftCount; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(address, i)
          nfts.push({
            tokenId: Number(tokenId),
            type: 'Government Bond',
            value: '200 TRG',
            interestRate: '10%'
          })
        } catch (error) {
          console.error(`Erreur NFT ${i}:`, error)
        }
      }

      return {
        count: nftCount,
        nfts,
        totalValue: nftCount * 200 // Chaque obligation vaut 200 TRG
      }
    } catch (error) {
      console.error('Erreur NFT info:', error)
      return { count: 0, nfts: [], totalValue: 0 }
    }
  }

  // Obtenir toutes les balances d'un utilisateur
  async getAllBalances(address) {
    if (!this.provider || !address) {
      return { tokens: {}, nfts: { count: 0, nfts: [], totalValue: 0 } }
    }

    try {
      const [trgBalance, clvBalance, rooBalance, nftInfo] = await Promise.all([
        this.getTokenBalance('TRG', address),
        this.getTokenBalance('CLV', address), 
        this.getTokenBalance('ROO', address),
        this.getNFTInfo(address)
      ])

      return {
        tokens: {
          TRG: trgBalance,
          CLV: clvBalance,
          ROO: rooBalance
        },
        nfts: nftInfo
      }
    } catch (error) {
      console.error('Erreur récupération balances:', error)
      return { tokens: {}, nfts: { count: 0, nfts: [], totalValue: 0 } }
    }
  }

  // Calculer la valeur totale du portfolio (en TRG)
  calculatePortfolioValue(balances) {
    if (!balances || !balances.tokens) return 0

    const prices = {
      TRG: 1,    // 1 TRG = 1 TRG (base)
      CLV: 50,   // 1 CLV = 50 TRG
      ROO: 45,   // 1 ROO = 45 TRG
    }

    let totalValue = 0

    Object.entries(balances.tokens).forEach(([symbol, balance]) => {
      if (balance && balance.formatted) {
        let tokenAmount = parseFloat(balance.formatted)
        
        if (tokenAmount >= 1000000000000000000) {
          tokenAmount = tokenAmount / Math.pow(10, 18)
        }
        
        const tokenValue = tokenAmount * (prices[symbol] || 0)
        totalValue += tokenValue
        
        console.log(`💰 ${symbol}: ${tokenAmount.toFixed(2)} × ${prices[symbol]} = ${tokenValue.toFixed(2)} TRG`)
      }
    })

    if (balances.nfts && balances.nfts.totalValue) {
      totalValue += balances.nfts.totalValue
    }

    console.log(`📊 Portfolio total: ${totalValue.toFixed(2)} TRG`)
    return totalValue
  }

  // Formatage des balances
  formatBalance(balance, symbol) {
    if (!balance || !balance.formatted) return '0'
    
    let value = parseFloat(balance.formatted)
    
    if (value >= 1000000000000000000) {
      value = value / Math.pow(10, 18)
    }
    
    if (symbol === 'TRG') {
      return value.toLocaleString('fr-FR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    } else {
      return value.toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
      })
    }
  }
}

export const tokenService = new TokenService()
export default tokenService
