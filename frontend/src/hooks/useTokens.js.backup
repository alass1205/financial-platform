import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '../context/WalletContext'
import tokenService from '../services/tokenService'

export function useTokens() {
  const { provider, account, isConnected } = useWallet()
  const [balances, setBalances] = useState({ tokens: {}, nfts: { count: 0, nfts: [], totalValue: 0 } })
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Initialiser les contrats
  useEffect(() => {
    const initContracts = async () => {
      if (provider && isConnected) {
        const success = await tokenService.initializeContracts(provider)
        if (!success) {
          setError('Impossible d\'initialiser les contrats')
        }
      }
    }

    initContracts()
  }, [provider, isConnected])

  // Charger les balances
  const loadBalances = useCallback(async () => {
    if (!provider || !account || !isConnected) {
      setBalances({ tokens: {}, nfts: { count: 0, nfts: [], totalValue: 0 } })
      setPortfolioValue(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const newBalances = await tokenService.getAllBalances(account)
      const totalValue = tokenService.calculatePortfolioValue(newBalances)
      
      setBalances(newBalances)
      setPortfolioValue(totalValue)
      setLastUpdate(new Date())
      
      console.log('✅ Balances mises à jour:', newBalances)
    } catch (error) {
      console.error('❌ Erreur chargement balances:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [provider, account, isConnected])

  // Charger les balances au montage et quand le wallet change
  useEffect(() => {
    loadBalances()
  }, [loadBalances])

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      loadBalances()
    }, 30000) // 30 secondes

    return () => clearInterval(interval)
  }, [isConnected, loadBalances])

  // Rafraîchir manuellement
  const refreshBalances = useCallback(() => {
    loadBalances()
  }, [loadBalances])

  // Obtenir les informations d'un token spécifique
  const getTokenInfo = useCallback(async (symbol) => {
    if (!provider) return null
    return await tokenService.getTokenInfo(symbol)
  }, [provider])

  return {
    // État
    balances,
    portfolioValue,
    isLoading,
    error,
    lastUpdate,
    isConnected,
    
    // Actions
    refreshBalances,
    getTokenInfo,
    
    // Utilitaires
    hasTokens: Object.keys(balances.tokens).length > 0,
    hasNFTs: balances.nfts.count > 0,
  }
}
