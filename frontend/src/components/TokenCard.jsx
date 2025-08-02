import { RefreshCw, TrendingUp, Coins, Award } from 'lucide-react'

function TokenCard({ symbol, name, balance, value, type = "token", isLoading = false }) {
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
    <div className="card-hover group">
      {/* Header avec icône */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 ${style.bg} rounded-xl`}>
            <Icon className={`w-6 h-6 ${style.text}`} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{symbol}</h3>
            <p className="text-sm text-gray-500">{name}</p>
          </div>
        </div>
        
        {isLoading && (
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Balance */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-sm text-gray-600">Balance</span>
          <span className="text-2xl font-bold text-gray-900">
            {balance}
          </span>
        </div>
        
        {value && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Valeur</span>
            <span className={`text-sm font-semibold ${style.text}`}>
              {value} TRG
            </span>
          </div>
        )}
      </div>

      {/* Barre de progression decorative */}
      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${style.gradient} transform group-hover:scale-x-105 transition-transform duration-300`}
          style={{ width: '70%' }}
        />
      </div>
    </div>
  )
}

export default TokenCard
