// frontend/src/hooks/useTrading.js
import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '../context/WalletContext'
import apiService from '../services/apiService'

export function useTrading() {
  const { account, isConnected } = useWallet()
  const [orders, setOrders] = useState([])
  const [orderBooks, setOrderBooks] = useState({})
  const [trades, setTrades] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Paires de trading disponibles
  const tradingPairs = [
    { symbol: 'CLV/TRG', base: 'CLV', quote: 'TRG', name: 'Clove Company / Triangle' },
    { symbol: 'ROO/TRG', base: 'ROO', quote: 'TRG', name: 'Rooibos Limited / Triangle' },
    { symbol: 'GOV/TRG', base: 'GOV', quote: 'TRG', name: 'Government Bonds / Triangle' }
  ]

  // Login automatique quand le wallet se connecte
  useEffect(() => {
    const autoLogin = async () => {
      if (isConnected && account && !isLoggedIn) {
        try {
          await apiService.login(account)
          setIsLoggedIn(true)
          console.log('✅ Auto-login réussi')
        } catch (error) {
          console.error('❌ Erreur auto-login:', error)
          setError(error.message)
        }
      }
    }

    autoLogin()
  }, [isConnected, account, isLoggedIn])

  // 🔧 CORRECTION - Créer un ordre avec les bonnes données
  const createOrder = useCallback(async (orderData) => {
    if (!isLoggedIn) {
      throw new Error('Vous devez être connecté pour trader')
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🔧 OrderData reçu:', orderData)
      
      // TRANSFORMATION DES DONNÉES POUR LE BACKEND
      const [baseToken] = orderData.pair.split('/')
      
      const backendData = {
        assetSymbol: baseToken,        // CLV au lieu de CLV/TRG
        type: orderData.type,          // BUY ou SELL
        price: orderData.price,        // Numérique
        quantity: orderData.quantity   // Numérique
      }
      
      console.log('📦 Données envoyées au backend:', backendData)
      
      const result = await apiService.createOrder(backendData)
      
      // Recharger les ordres après création
      await loadOrders()
      await loadOrderBook(orderData.pair)
      
      return result
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [account, isLoggedIn])

  // Annuler un ordre
  const cancelOrder = useCallback(async (orderId) => {
    if (!isLoggedIn) {
      throw new Error('Vous devez être connecté')
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiService.cancelOrder(orderId)
      
      // Recharger les ordres après annulation
      await loadOrders()
      
      return result
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [isLoggedIn])

  // Charger mes ordres
  const loadOrders = useCallback(async () => {
    if (!isLoggedIn) return

    try {
      const result = await apiService.getMyOrders()
      if (result.orders) {
        setOrders(result.orders)
      }
    } catch (error) {
      console.error('Erreur chargement ordres:', error)
    }
  }, [isLoggedIn])

  // Charger l'order book d'une paire
  const loadOrderBook = useCallback(async (pair) => {
    try {
      const result = await apiService.getOrderBook(pair)
      if (result.orderBook) {
        setOrderBooks(prev => ({
          ...prev,
          [pair]: result.orderBook
        }))
      }
    } catch (error) {
      console.error(`Erreur chargement order book ${pair}:`, error)
    }
  }, [])

  // Charger mes trades
  const loadTrades = useCallback(async () => {
    if (!isLoggedIn) return

    try {
      const result = await apiService.getMyTrades()
      if (result.trades) {
        setTrades(result.trades)
      }
    } catch (error) {
      console.error('Erreur chargement trades:', error)
    }
  }, [isLoggedIn])

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    try {
      const result = await apiService.getTradingStats()
      if (result.stats) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }, [])

  // Charger toutes les données au login
  useEffect(() => {
    if (isLoggedIn) {
      loadOrders()
      loadTrades()
      loadStats()
      
      // Charger les order books pour toutes les paires
      tradingPairs.forEach(pair => {
        loadOrderBook(pair.symbol)
      })
    }
  }, [isLoggedIn, loadOrders, loadTrades, loadStats, loadOrderBook])

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    if (!isLoggedIn) return

    const interval = setInterval(() => {
      loadOrders()
      tradingPairs.forEach(pair => {
        loadOrderBook(pair.symbol)
      })
    }, 10000) // 10 secondes

    return () => clearInterval(interval)
  }, [isLoggedIn, loadOrders, loadOrderBook])

  return {
    // État
    orders,
    orderBooks,
    trades,
    stats,
    tradingPairs,
    isLoading,
    error,
    isLoggedIn,
    isConnected,
    
    // Actions
    createOrder,
    cancelOrder,
    loadOrders,
    loadOrderBook,
    loadTrades,
    loadStats,
    
    // Utilitaires
    clearError: () => setError(null),
  }
}