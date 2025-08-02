import { useState } from 'react'
import { Wallet, LogOut, AlertCircle, ExternalLink } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'

function WalletButton() {
  const {
    account,
    balance,
    chainId,
    isConnecting,
    error,
    isConnected,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    switchToLocalNetwork,
  } = useWallet()

  const [showDetails, setShowDetails] = useState(false)

  // Format de l'adresse (0x1234...5678)
  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Format de la balance
  const formatBalance = (balance) => {
    return parseFloat(balance).toFixed(4)
  }

  // Vérifier si on est sur le bon réseau
  const isCorrectNetwork = chainId === 31337 // localhost:8545

  if (!isMetaMaskInstalled) {
    return (
      <div className="flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 text-danger-500" />
        <span className="text-sm text-danger-600">MetaMask requis</span>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm py-2 px-4 flex items-center space-x-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Installer MetaMask</span>
        </a>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-4">
        {error && (
          <span className="text-sm text-danger-600 max-w-xs truncate">
            {error}
          </span>
        )}
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50"
        >
          <Wallet className="w-5 h-5" />
          <span>{isConnecting ? 'Connexion...' : 'Connecter Wallet'}</span>
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-4">
        {/* Alerte réseau incorrect */}
        {!isCorrectNetwork && (
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-warning-500" />
            <button
              onClick={switchToLocalNetwork}
              className="text-sm text-warning-600 hover:text-warning-700 underline"
            >
              Changer vers Localhost
            </button>
          </div>
        )}

        {/* Informations wallet */}
        <div 
          className="flex items-center space-x-3 bg-white rounded-xl px-4 py-2 shadow-soft border border-gray-100 cursor-pointer hover:shadow-medium transition-all duration-200"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">
              {formatAddress(account)}
            </span>
            <span className="text-xs text-gray-500">
              {formatBalance(balance)} ETH
            </span>
          </div>
          <Wallet className="w-5 h-5 text-primary-500" />
        </div>

        {/* Bouton déconnexion */}
        <button
          onClick={disconnectWallet}
          className="p-2 text-gray-500 hover:text-danger-500 transition-colors duration-200"
          title="Déconnecter"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Détails étendus */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-strong border border-gray-100 p-4 z-50">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Adresse :</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {account}
              </code>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Balance :</span>
              <span className="text-sm font-semibold">{formatBalance(balance)} ETH</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Réseau :</span>
              <span className={`text-sm font-semibold ${isCorrectNetwork ? 'text-success-600' : 'text-warning-600'}`}>
                {isCorrectNetwork ? 'Localhost ✓' : `Chain ID: ${chainId}`}
              </span>
            </div>

            {!isCorrectNetwork && (
              <button
                onClick={switchToLocalNetwork}
                className="w-full btn-primary text-sm py-2"
              >
                Changer vers Localhost (31337)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletButton
