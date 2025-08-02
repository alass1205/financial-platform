import { useState } from 'react'
import { TrendingUp, BarChart3, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { useTrading } from '../hooks/useTrading'
import { useWallet } from '../context/WalletContext'
import OrderForm from '../components/OrderForm'
import OrderBook from '../components/OrderBook'
import TradesHistory from '../components/TradesHistory'

function Trading() {
  const { isConnected } = useWallet()
  const { 
    tradingPairs, 
    orderBooks, 
    orders, 
    trades, 
    stats, 
    isLoggedIn, 
    error,
    cancelOrder,
    loadOrders,
    loadOrderBook,
    loadTrades,
    isLoading
  } = useTrading()
  
  const [selectedPair, setSelectedPair] = useState('CLV/TRG')
  const [refreshing, setRefreshing] = useState(false)

  // Rafraîchir toutes les données
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        loadOrders(),
        loadOrderBook(selectedPair),
        loadTrades()
      ])
    } catch (error) {
      console.error('Erreur rafraîchissement:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Annuler un ordre
  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cet ordre ?')) {
      try {
        await cancelOrder(orderId)
        alert('Ordre annulé avec succès')
      } catch (error) {
        alert(`Erreur: ${error.message}`)
      }
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Trading non disponible</h2>
        <p className="text-gray-600 mb-6">
          Connectez votre MetaMask pour accéder à l'interface de trading
        </p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 text-warning-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Connexion en cours...</h2>
        <p className="text-gray-600 mb-6">
          Connexion automatique au backend de trading
        </p>
        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 inline-block">
            <p className="text-danger-700">{error}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Trading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📈 Trading DeFi</h1>
          <p className="text-gray-600 mt-1">
            Échangez vos tokens en temps réel
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Bouton rafraîchir */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          
          {/* Sélecteur de paire */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Paire :</label>
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {tradingPairs.map(pair => (
                <option key={pair.symbol} value={pair.symbol}>
                  {pair.symbol} - {pair.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-gray-600">Volume 24h</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.volume24h || '0'} TRG
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-success-600" />
              <div>
                <p className="text-sm text-gray-600">Trades aujourd'hui</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.tradesCount || '0'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-warning-600" />
              <div>
                <p className="text-sm text-gray-600">Ordres actifs</p>
                <p className="text-xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-secondary-600" />
              <div>
                <p className="text-sm text-gray-600">Mes trades</p>
                <p className="text-xl font-bold text-gray-900">
                  {trades.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interface principale */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Formulaire d'ordre */}
        <div className="xl:col-span-1">
          <OrderForm selectedPair={selectedPair} />
        </div>

        {/* Order Book */}
        <div className="xl:col-span-1">
          <OrderBook 
            pair={selectedPair}
            orderBook={orderBooks[selectedPair]}
            isLoading={isLoading}
          />
        </div>

        {/* Historique des trades et ordres */}
        <div className="xl:col-span-1">
          <TradesHistory 
            trades={trades}
            orders={orders}
            onCancelOrder={handleCancelOrder}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Section inférieure - Large sur toute la largeur */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages d'information */}
        <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200">
          <div className="flex items-center space-x-4">
            <AlertCircle className="w-8 h-8 text-primary-600" />
            <div>
              <h3 className="font-bold text-primary-900">🎯 Interface Trading Opérationnelle !</h3>
              <p className="text-primary-700 mt-1">
                Formulaire de trading, order books, et historique des trades fonctionnels.
                Le matching engine FIFO traite vos ordres automatiquement toutes les 5 secondes.
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="card bg-gradient-to-r from-success-50 to-success-100 border border-success-200">
          <h3 className="font-bold text-success-900 mb-3">🚀 Comment trader :</h3>
          <ol className="text-success-800 space-y-1 text-sm">
            <li>1. Sélectionnez une paire (CLV/TRG, ROO/TRG, GOV/TRG)</li>
            <li>2. Choisissez BUY (acheter) ou SELL (vendre)</li>
            <li>3. Entrez la quantité et le prix</li>
            <li>4. Vérifiez votre balance disponible</li>
            <li>5. Soumettez l'ordre - il sera traité automatiquement !</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default Trading
