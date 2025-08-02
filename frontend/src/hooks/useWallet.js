import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'

export function useWallet() {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [balance, setBalance] = useState('0')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [chainId, setChainId] = useState(null)

  // Vérifier si MetaMask est installé
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }, [])

  // Connecter MetaMask
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask n\'est pas installé')
      return false
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Demander la connexion
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length === 0) {
        throw new Error('Aucun compte sélectionné')
      }

      // Créer le provider et signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      const web3Signer = await web3Provider.getSigner()
      const address = await web3Signer.getAddress()

      // Obtenir balance et chainId
      const balance = await web3Provider.getBalance(address)
      const network = await web3Provider.getNetwork()

      setAccount(address)
      setProvider(web3Provider)
      setSigner(web3Signer)
      setBalance(ethers.formatEther(balance))
      setChainId(Number(network.chainId))

      console.log('✅ Wallet connecté:', address)
      return true

    } catch (error) {
      console.error('❌ Erreur connexion wallet:', error)
      setError(error.message)
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [isMetaMaskInstalled])

  // Déconnecter wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setBalance('0')
    setChainId(null)
    setError(null)
    console.log('🔌 Wallet déconnecté')
  }, [])

  // Changer de réseau vers localhost:8545
  const switchToLocalNetwork = useCallback(async () => {
    if (!isMetaMaskInstalled()) return false

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 en hex (localhost)
      })
      return true
    } catch (error) {
      // Si le réseau n'existe pas, l'ajouter
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7a69',
              chainName: 'Localhost 8545',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['http://127.0.0.1:8545'],
              blockExplorerUrls: null,
            }],
          })
          return true
        } catch (addError) {
          console.error('Erreur ajout réseau:', addError)
          return false
        }
      }
      console.error('Erreur changement réseau:', error)
      return false
    }
  }, [isMetaMaskInstalled])

  // Mise à jour de la balance
  const updateBalance = useCallback(async () => {
    if (provider && account) {
      try {
        const balance = await provider.getBalance(account)
        setBalance(ethers.formatEther(balance))
      } catch (error) {
        console.error('Erreur mise à jour balance:', error)
      }
    }
  }, [provider, account])

  // Écouter les changements de compte
  useEffect(() => {
    if (!isMetaMaskInstalled()) return

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet()
      } else if (accounts[0] !== account) {
        connectWallet()
      }
    }

    const handleChainChanged = (chainId) => {
      setChainId(Number(chainId))
      // Reconnecter pour mettre à jour le provider
      if (account) {
        connectWallet()
      }
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [account, connectWallet, disconnectWallet, isMetaMaskInstalled])

  // Auto-connexion au chargement
  useEffect(() => {
    const autoConnect = async () => {
      if (isMetaMaskInstalled()) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          })
          if (accounts.length > 0) {
            connectWallet()
          }
        } catch (error) {
          console.error('Erreur auto-connexion:', error)
        }
      }
    }

    autoConnect()
  }, [connectWallet, isMetaMaskInstalled])

  return {
    // État
    account,
    provider,
    signer,
    balance,
    chainId,
    isConnecting,
    error,
    isConnected: !!account,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchToLocalNetwork,
    updateBalance,
  }
}
