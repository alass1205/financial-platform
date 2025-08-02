import { Wallet, TrendingUp, DollarSign, Activity } from 'lucide-react'
import { useWallet } from '../context/WalletContext'

function Dashboard() {
  const { isConnected, account, balance, chainId } = useWallet()

  return (
    <div className="space-y-6">
      {/* Header avec état wallet */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          🚀 DeFi Trading Platform
        </h1>
        <p className="text-gray-600 mt-2">
          {isConnected 
            ? `Connecté avec ${account?.slice(0, 6)}...${account?.slice(-4)}` 
            : 'Connectez votre wallet pour commencer'
          }
        </p>
      </div>

      {/* Alerte si pas connecté */}
      {!isConnected && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-6 text-center">
          <Wallet className="w-12 h-12 text-warning-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-warning-800 mb-2">
            Wallet non connecté
          </h3>
          <p className="text-warning-700 mb-4">
            Connectez votre MetaMask pour accéder à toutes les fonctionnalités de trading.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-hover">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Wallet className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Balance ETH</p>
              <p className="text-2xl font-bold text-gray-900">
                {isConnected ? `${parseFloat(balance).toFixed(4)} ETH` : '--'}
              </p>
            </div>
          </div>
        </div>

        <div className="card-hover">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-success-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Portfolio Total</p>
              <p className="text-2xl font-bold text-success-600">
                {isConnected ? '$12,456' : '--'}
              </p>
            </div>
          </div>
        </div>

        <div className="card-hover">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-warning-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Trades Actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {isConnected ? '7' : '--'}
              </p>
            </div>
          </div>
        </div>

        <div className="card-hover">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-secondary-100 rounded-xl">
              <Activity className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Réseau</p>
              <p className="text-lg font-bold text-gray-900">
                {isConnected 
                  ? (chainId === 31337 ? 'Localhost ✓' : `Chain ${chainId}`)
                  : '--'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message de bienvenue */}
      <div className="card text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {isConnected ? '🎉 Wallet connecté avec succès !' : '👋 Bienvenue !'}
        </h2>
        <p className="text-gray-600 mb-6">
          {isConnected 
            ? 'Votre trading engine est opérationnel. Vous pouvez maintenant accéder à votre portfolio et commencer à trader.'
            : 'Connectez votre MetaMask pour débloquer toutes les fonctionnalités de trading DeFi.'
          }
        </p>
        
        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-primary-50 rounded-xl">
              <h4 className="font-semibold text-primary-800">💰 Portfolio</h4>
              <p className="text-sm text-primary-600 mt-1">Gérez vos tokens TRG, CLV, ROO, GOV</p>
            </div>
            <div className="p-4 bg-success-50 rounded-xl">
              <h4 className="font-semibold text-success-800">📈 Trading</h4>
              <p className="text-sm text-success-600 mt-1">Échangez vos tokens en temps réel</p>
            </div>
            <div className="p-4 bg-secondary-50 rounded-xl">
              <h4 className="font-semibold text-secondary-800">📊 Analytics</h4>
              <p className="text-sm text-secondary-600 mt-1">Suivez vos performances</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
