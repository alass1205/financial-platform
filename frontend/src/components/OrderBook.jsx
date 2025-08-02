import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, BarChart3 } from 'lucide-react'

function OrderBook({ pair, orderBook, isLoading }) {
  const [animation, setAnimation] = useState(false)

  // Animation lors des changements
  useEffect(() => {
    if (orderBook) {
      setAnimation(true)
      const timer = setTimeout(() => setAnimation(false), 300)
      return () => clearTimeout(timer)
    }
  }, [orderBook])

  // Données par défaut si pas d'order book
  const defaultOrderBook = {
    buyOrders: [],
    sellOrders: [],
    lastPrice: 0,
    spread: 0
  }

  const data = orderBook || defaultOrderBook

  // Calculer le spread
  const spread = data.sellOrders.length > 0 && data.buyOrders.length > 0
    ? (data.sellOrders[0]?.price - data.buyOrders[0]?.price).toFixed(2)
    : 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">📊 Order Book</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{pair}</span>
          {isLoading && (
            <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Prix et spread */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-success-50 rounded-lg text-center">
          <p className="text-xs text-success-600 mb-1">Dernier Prix</p>
          <p className="text-lg font-bold text-success-700">
            {data.lastPrice || '--'}
          </p>
        </div>
        <div className="p-3 bg-warning-50 rounded-lg text-center">
          <p className="text-xs text-warning-600 mb-1">Spread</p>
          <p className="text-lg font-bold text-warning-700">
            {spread || '--'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Ordres de vente (SELL) - Rouge */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="w-4 h-4 text-danger-500" />
            <span className="text-sm font-semibold text-danger-700">Ordres de Vente</span>
          </div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data.sellOrders.length > 0 ? (
              data.sellOrders.slice(0, 5).map((order, index) => (
                <div 
                  key={`sell-${index}`}
                  className={`flex justify-between text-sm p-2 rounded transition-all duration-300 ${
                    animation ? 'bg-danger-100' : 'bg-danger-50 hover:bg-danger-100'
                  }`}
                >
                  <span className="text-danger-700 font-medium">{order.quantity}</span>
                  <span className="text-danger-800 font-bold">{order.price}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">
                <BarChart3 className="w-6 h-6 mx-auto mb-2" />
                <p className="text-xs">Aucun ordre de vente</p>
              </div>
            )}
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t-2 border-gray-200 relative">
          <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-3 text-xs text-gray-500">
            SPREAD
          </span>
        </div>

        {/* Ordres d'achat (BUY) - Vert */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success-500" />
            <span className="text-sm font-semibold text-success-700">Ordres d'Achat</span>
          </div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {data.buyOrders.length > 0 ? (
              data.buyOrders.slice(0, 5).map((order, index) => (
                <div 
                  key={`buy-${index}`}
                  className={`flex justify-between text-sm p-2 rounded transition-all duration-300 ${
                    animation ? 'bg-success-100' : 'bg-success-50 hover:bg-success-100'
                  }`}
                >
                  <span className="text-success-700 font-medium">{order.quantity}</span>
                  <span className="text-success-800 font-bold">{order.price}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">
                <BarChart3 className="w-6 h-6 mx-auto mb-2" />
                <p className="text-xs">Aucun ordre d'achat</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* En-têtes des colonnes */}
      <div className="flex justify-between text-xs text-gray-500 mt-4 px-2">
        <span>Quantité</span>
        <span>Prix (TRG)</span>
      </div>
    </div>
  )
}

export default OrderBook
