import { Clock, TrendingUp, TrendingDown, X } from 'lucide-react'
import { useState } from 'react'

function TradesHistory({ trades, orders, onCancelOrder, isLoading }) {
  const [activeTab, setActiveTab] = useState('trades') // 'trades' ou 'orders'

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '--'
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Formater le statut
  const getStatusStyle = (status) => {
    const styles = {
      PENDING: 'bg-warning-100 text-warning-700',
      FILLED: 'bg-success-100 text-success-700', 
      CANCELLED: 'bg-gray-100 text-gray-700',
      PARTIAL: 'bg-blue-100 text-blue-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="card">
      {/* Onglets */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('trades')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'trades'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📈 Mes Trades ({trades.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'orders'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Mes Ordres ({orders.length})
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="max-h-80 overflow-y-auto">
        {activeTab === 'trades' ? (
          /* Historique des trades */
          trades.length > 0 ? (
            <div className="space-y-3">
              {trades.map((trade) => (
                <div key={trade.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      {trade.side === 'BUY' ? (
                        <TrendingUp className="w-5 h-5 text-success-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-danger-500" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            trade.side === 'BUY' 
                              ? 'bg-success-100 text-success-700' 
                              : 'bg-danger-100 text-danger-700'
                          }`}>
                            {trade.side}
                          </span>
                          <span className="font-semibold">{trade.pair}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {trade.quantity} @ {trade.price} TRG
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {(trade.quantity * trade.price).toFixed(2)} TRG
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(trade.executedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Aucun trade effectué</p>
              <p className="text-sm">Vos trades apparaîtront ici</p>
            </div>
          )
        ) : (
          /* Liste des ordres */
          orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      {order.type === 'BUY' ? (
                        <TrendingUp className="w-5 h-5 text-success-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-danger-500" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            order.type === 'BUY' 
                              ? 'bg-success-100 text-success-700' 
                              : 'bg-danger-100 text-danger-700'
                          }`}>
                            {order.type}
                          </span>
                          <span className="font-semibold">{order.pair}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.quantity} @ {order.price} TRG
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {(order.quantity * order.price).toFixed(2)} TRG
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      {order.status === 'PENDING' && onCancelOrder && (
                        <button
                          onClick={() => onCancelOrder(order.id)}
                          className="p-1 text-gray-400 hover:text-danger-500 transition-colors"
                          title="Annuler l'ordre"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Aucun ordre actif</p>
              <p className="text-sm">Créez votre premier ordre !</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default TradesHistory
