import { createContext, useContext } from 'react'
import { useWallet as useWalletHook } from '../hooks/useWallet'

const WalletContext = createContext()

export function WalletProvider({ children }) {
  const wallet = useWalletHook()

  return (
    <WalletContext.Provider value={wallet}>
      {children}
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
