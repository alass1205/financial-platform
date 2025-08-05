import { RefreshCw, TrendingUp, Coins, Award, Download } from 'lucide-react'

function TokenCard({ symbol, name, balance, value, type = "token", isLoading = false, onWithdraw }) {
  // Couleurs et icônes par token
  const getTokenStyle = (symbol) => {
    const styles = {
      TRG: {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        icon: Coins
      },
      CLV: {
        gradient: 'from-green-500 to-green-600', 
        bg: 'bg-green-50',
        text: 'text-green-600',
        icon: TrendingUp
      },
      ROO: {
        gradient: 'from-orange-500 to-orange-600',
        bg: 'bg-orange-50', 
        text: 'text-orange-600',
        icon: TrendingUp
      },
      GOV: {
        gradient: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-50',
        text: 'text-purple-600', 
        icon: Award
      }
    }
    return styles[symbol] || styles.TRG
  }

  const style = getTokenStyle(symbol)
  const Icon = style.icon

  return (
    <div className="card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 ${style.bg} rounded-xl`}>
            <Icon className={`w-6 h-6 ${style.text}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{symbol}</h3>
            <p className="text-sm text-gray-600">{name}</p>
          </div>
        </div>
        
        {/* Bouton Withdraw - NOUVEAU POUR AUDIT */}
        {(symbol === 'CLV' || symbol === 'ROO' || symbol === 'GOV') && parseFloat(balance) > 0 && !isLoading && (
          <button
            onClick={() => onWithdraw && onWithdraw(symbol)}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            title={`Withdraw ${symbol}`}
          >
            <Download className="w-3 h-3" />
            <span>Withdraw</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Balance</span>
          <div className="flex items-center space-x-2">
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />}
            <span className="font-semibold text-gray-900">
              {balance} {symbol}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Valeur</span>
          <span className={`font-semibold ${style.text}`}>
            {value} {type === 'nft' ? '' : 'TRG'}
          </span>
        </div>

        {/* Barre de progression visuelle */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 bg-gradient-to-r ${style.gradient} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(100, (parseFloat(balance) / 20) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default TokenCard
