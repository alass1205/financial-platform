import { useState } from 'react'
import { RefreshCw, Wallet, TrendingUp, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useTokens } from '../hooks/useTokens'
import { useWallet } from '../context/WalletContext'
import TokenCard from '../components/TokenCard'

function Portfolio() {
  const { isConnected, account } = useWallet()
  const { 
    balances, 
    portfolioValue, 
    isLoading, 
    error, 
    lastUpdate, 
    refreshBalances,
    hasTokens,
    hasNFTs 
  } = useTokens()
  
  const [showValues, setShowValues] = useState(true)

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Wallet non connecté</h2>
        <p className="text-gray-600 mb-6">
          Connectez votre MetaMask pour voir votre portfolio DeFi
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Portfolio */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Mon Portfolio</h1>
          <p className="text-gray-600 mt-1">
            Compte : {account?.slice(0, 6)}...{account?.slice(-4)}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowValues(!showValues)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title={showValues ? "Masquer les valeurs" : "Afficher les valeurs"}
          >
            {showValues ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          
          <button
            onClick={refreshBalances}
            disabled={isLoading}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0" />
          <div>
            <p className="text-danger-800 font-semibold">Erreur de chargement</p>
            <p className="text-danger-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Résumé du Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Valeur totale */}
        <div className="card lg:col-span-2">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Valeur totale du portfolio</p>
              <p className="text-3xl font-bold text-gray-900">
                {showValues ? `${portfolioValue.toFixed(2)} TRG` : '••••••'}
              </p>
              <p className="text-sm text-gray-500">
                ≈ ${(portfolioValue * 1.2).toFixed(2)} USD (fictif)
              </p>
            </div>
          </div>
        </div>

        {/* Dernière mise à jour */}
        <div className="card">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Dernière mise à jour</p>
            <p className="text-lg font-semibold text-gray-900">
              {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--'}
            </p>
            <div className={`inline-flex items-center space-x-1 text-xs px-2 py-1 rounded-full mt-2 ${
              isLoading ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isLoading ? 'bg-warning-500 animate-pulse' : 'bg-success-500'
              }`} />
              <span>{isLoading ? 'Synchronisation...' : 'Synchronisé'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tokens ERC20 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">🪙 Tokens DeFi</h2>
        
        {hasTokens ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* TRG - Stablecoin */}
            <TokenCard
              symbol="TRG"
              name="Triangle Coin (Stablecoin)"
              balance={showValues ? parseFloat(balances.tokens.TRG?.formatted || 0).toFixed(2) : '••••'}
              value={showValues ? parseFloat(balances.tokens.TRG?.formatted || 0).toFixed(2) : '••••'}
              isLoading={isLoading}
            />
            
            {/* CLV - Actions Clove */}
            <TokenCard
              symbol="CLV"
              name="Clove Company (Actions)"
              balance={showValues ? parseFloat(balances.tokens.CLV?.formatted || 0).toFixed(0) : '••••'}
              value={showValues ? (parseFloat(balances.tokens.CLV?.formatted || 0) * 50).toFixed(2) : '••••'}
              isLoading={isLoading}
            />
            
            {/* ROO - Actions Rooibos */}
            <TokenCard
              symbol="ROO"
              name="Rooibos Limited (Actions)"
              balance={showValues ? parseFloat(balances.tokens.ROO?.formatted || 0).toFixed(0) : '••••'}
              value={showValues ? (parseFloat(balances.tokens.ROO?.formatted || 0) * 45).toFixed(2) : '••••'}
              isLoading={isLoading}
            />
          </div>
        ) : (
          <div className="card text-center">
            <p className="text-gray-500">Aucun token DeFi trouvé</p>
            <p className="text-sm text-gray-400 mt-2">
              Vérifiez que vous êtes connecté au bon réseau
            </p>
          </div>
        )}
      </div>

      {/* NFTs - Obligations */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📜 Obligations Gouvernementales (NFT)</h2>
        
        {hasNFTs ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Résumé NFT */}
            <TokenCard
              symbol="GOV"
              name="Government Bonds"
              balance={showValues ? `${balances.nfts.count} obligations` : '••••'}
              value={showValues ? balances.nfts.totalValue.toFixed(2) : '••••'}
              type="nft"
              isLoading={isLoading}
            />
            
            {/* Détails des obligations */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">📋 Détails des obligations</h3>
              <div className="space-y-3">
                {balances.nfts.nfts.slice(0, 3).map((nft, index) => (
                  <div key={nft.tokenId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Bond #{nft.tokenId}</p>
                      <p className="text-sm text-gray-600">{nft.interestRate} d'intérêt</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-600">{nft.value}</p>
                    </div>
                  </div>
                ))}
                
                {balances.nfts.count > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{balances.nfts.count - 3} autres obligations...
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center">
            <p className="text-gray-500">Aucune obligation trouvée</p>
            <p className="text-sm text-gray-400 mt-2">
              Les obligations gouvernementales apparaîtront ici
            </p>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">🚀 Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary">
            📈 Trader mes tokens
          </button>
          <button className="btn-secondary">
            💰 Réclamer dividendes
          </button>
          <button className="btn-secondary">
            📊 Voir analytics
          </button>
        </div>
      </div>
    </div>
  )
}

export default Portfolio
