import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '../context/WalletContext'
import tokenService from '../services/tokenService'
import apiService from '../services/apiService'

export function useTokens() {
  const { account, isConnected } = useWallet()
  const [balances, setBalances] = useState({
    tokens: {},
    nfts: { count: 0, nfts: [], totalValue: 0 }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [useDatabase, setUseDatabase] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Auto-login pour accéder à la DB
  useEffect(() => {
    const autoLogin = async () => {
      if (isConnected && account && !isLoggedIn) {
        try {
          await apiService.login(account)
          setIsLoggedIn(true)
          console.log('✅ Auto-login réussi pour Portfolio DB')
        } catch (error) {
          console.error('❌ Erreur auto-login Portfolio:', error)
          setUseDatabase(false)
        }
      }
    }

    autoLogin()
  }, [isConnected, account, isLoggedIn])

  // Charger les balances depuis la base de données
  const loadBalancesFromDatabase = useCallback(async () => {
    if (!isLoggedIn) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await apiService.getPortfolioBalances()
      
      if (response.balances) {
        console.log('💾 Balances DB reçues:', response.balances)
        setBalances(response.balances)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('❌ Erreur balances DB:', error)
      setError(error.message)
      
      // Fallback vers la blockchain
      console.log('🔄 Fallback vers blockchain...')
      setUseDatabase(false)
      await loadBalancesFromBlockchain()
    } finally {
      setIsLoading(false)
    }
  }, [isLoggedIn])

  // Charger les balances depuis la blockchain (méthode originale)
  const loadBalancesFromBlockchain = useCallback(async () => {
    if (!account || !isConnected) return

    try {
      setIsLoading(true)
      setError(null)

      const blockchainBalances = await tokenService.getAllBalances(account)
      console.log('⛓️ Balances blockchain reçues:', blockchainBalances)
      setBalances(blockchainBalances)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('❌ Erreur balances blockchain:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [account, isConnected])

  // Méthode principale de chargement
  const loadBalances = useCallback(async () => {
    if (useDatabase && isLoggedIn) {
      await loadBalancesFromDatabase()
    } else if (isConnected && account) {
      await loadBalancesFromBlockchain()
    }
  }, [useDatabase, isLoggedIn, isConnected, account, loadBalancesFromDatabase, loadBalancesFromBlockchain])

  // Forcer le rechargement depuis la blockchain
  const loadFromBlockchain = useCallback(async () => {
    setUseDatabase(false)
    await loadBalancesFromBlockchain()
  }, [loadBalancesFromBlockchain])

  // Forcer le rechargement depuis la DB
  const loadFromDatabase = useCallback(async () => {
    if (isLoggedIn) {
      setUseDatabase(true)
      await loadBalancesFromDatabase()
    }
  }, [isLoggedIn, loadBalancesFromDatabase])

  // Chargement automatique
  useEffect(() => {
    if (isConnected && account) {
      loadBalances()
    }
  }, [isConnected, account, loadBalances])

  // 🔄 NOUVEAU - Écouter l'event de refresh après trade
  useEffect(() => {
    const handlePortfolioRefresh = () => {
      console.log('🔄 Portfolio refresh déclenché par trade')
      loadBalances()
    }

    window.addEventListener('portfolio-refresh', handlePortfolioRefresh)
    return () => window.removeEventListener('portfolio-refresh', handlePortfolioRefresh)
  }, [loadBalances])

  // Auto-refresh après trades (écouter les changements de route)
  useEffect(() => {
    const handleFocus = () => {
      if (useDatabase && isLoggedIn) {
        console.log('🔄 Refresh portfolio après focus')
        loadBalances()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [useDatabase, isLoggedIn, loadBalances])

  // Calculer la valeur totale du portfolio
  const portfolioValue = tokenService.calculatePortfolioValue(balances)

  // Vérifier si on a des tokens ou NFTs
  const hasTokens = balances.tokens && Object.keys(balances.tokens).length > 0
  const hasNFTs = balances.nfts && balances.nfts.count > 0

  return {
    // État
    balances,
    isLoading,
    error,
    lastUpdate,
    portfolioValue,
    useDatabase,
    isLoggedIn,
    hasTokens,
    hasNFTs,
    
    // Actions
    loadBalances,
    loadFromBlockchain,
    loadFromDatabase,
    refreshBalances: loadBalances,
    
    // Utilitaires
    clearError: () => setError(null),
    toggleSource: () => setUseDatabase(!useDatabase)
  }
}
