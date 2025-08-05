import { createContext, useContext, useState, useEffect } from 'react'
import { useWallet as useWalletHook } from '../hooks/useWallet'
import KYCModal from '../components/KYCModal'

// Export du contexte pour utilisation directe
export const WalletContext = createContext()

export function WalletProvider({ children }) {
  const wallet = useWalletHook()
  const [showKYC, setShowKYC] = useState(false)
  const [user, setUser] = useState(null)
  const [kycCompleted, setKycCompleted] = useState(false)
  const [kycRequired, setKycRequired] = useState(false)

  // Vérifier le statut KYC quand wallet se connecte
  useEffect(() => {
    const checkKYCStatus = async () => {
      if (wallet.account && !kycCompleted) {
        console.log('🔍 Vérification KYC pour:', wallet.account)
        
        try {
          const response = await fetch(`http://localhost:3001/api/auth/kyc-status/${wallet.account}`)
          const result = await response.json()
          
          console.log('📊 Résultat KYC:', result)
          
          if (result.success) {
            if (result.kycCompleted && result.user) {
              setUser(result.user)
              setKycCompleted(true)
              setKycRequired(false)
              setShowKYC(false)
              console.log('✅ KYC déjà complété pour:', wallet.account)
            } else {
              // KYC non complété, OBLIGATOIRE
              setKycRequired(true)
              setShowKYC(true)
              console.log('🔒 KYC OBLIGATOIRE pour:', wallet.account)
              console.log('🔒 kycRequired défini à:', true)
            }
          }
        } catch (error) {
          console.error('❌ Erreur vérification KYC:', error)
          // En cas d'erreur, KYC obligatoire par sécurité
          setKycRequired(true)
          setShowKYC(true)
          console.log('🔒 KYC OBLIGATOIRE (erreur) pour:', wallet.account)
        }
      }
    }

    checkKYCStatus()
  }, [wallet.account, kycCompleted])

  // Reset KYC state quand wallet se déconnecte
  useEffect(() => {
    if (!wallet.account) {
      setUser(null)
      setKycCompleted(false)
      setShowKYC(false)
      setKycRequired(false)
      console.log('🔌 Wallet déconnecté - Reset KYC')
    }
  }, [wallet.account])

  const handleKYCComplete = (userData) => {
    setUser(userData)
    setKycCompleted(true)
    setKycRequired(false)
    setShowKYC(false)
    console.log('🎉 KYC complété avec succès!')
  }

  // Fonction pour fermer le modal seulement si KYC pas obligatoire
  const handleCloseKYC = () => {
    console.log('❌ Tentative fermeture KYC - kycRequired:', kycRequired)
    
    if (!kycRequired) {
      setShowKYC(false)
      console.log('✅ Modal KYC fermé (pas obligatoire)')
    } else {
      // KYC obligatoire, afficher message
      console.log('🔒 Fermeture KYC refusée - obligatoire!')
      alert('🔒 La vérification KYC est obligatoire pour utiliser la plateforme. Veuillez compléter votre profil.')
    }
  }

  const contextValue = {
    ...wallet,
    user,
    kycCompleted,
    kycRequired,
    showKYC,
    setShowKYC
  }

  return (
    <WalletContext.Provider value={contextValue}>
      {/* Contenu accessible seulement si KYC complété OU wallet pas connecté */}
      {!wallet.account || kycCompleted ? children : (
        // Écran de blocage si wallet connecté mais KYC pas fait
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Vérification KYC Requise</h2>
            <p className="text-gray-600 mb-6">
              Pour des raisons de sécurité et de conformité réglementaire, vous devez compléter votre profil KYC avant d'accéder à la plateforme.
            </p>
            <p className="text-sm text-gray-500">
              Wallet connecté : {wallet.account?.slice(0, 6)}...{wallet.account?.slice(-4)}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              KYC Required: {kycRequired ? 'OUI' : 'NON'} | KYC Completed: {kycCompleted ? 'OUI' : 'NON'}
            </p>
          </div>
        </div>
      )}
      
      {/* Modal KYC - ne peut pas être fermé si obligatoire */}
      <KYCModal
        isOpen={showKYC}
        onClose={handleCloseKYC}
        onComplete={handleKYCComplete}
        walletAddress={wallet.account}
        required={kycRequired}
      />
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}