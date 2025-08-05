import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, Wallet, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { WalletContext } from '../context/WalletContext';
import { ethers } from 'ethers';

const AssetPage = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { account, signer, kycCompleted } = useContext(WalletContext);
  
  // États
  const [assetData, setAssetData] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [userBalance, setUserBalance] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour les formulaires
  const [sellForm, setSellForm] = useState({ quantity: '', price: '', type: 'market' });
  const [buyForm, setBuyForm] = useState({ quantity: '', price: '', type: 'market' });
  
  // États pour blockchain
  const [isTrading, setIsTrading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // 🆕 CONFIGURATION BLOCKCHAIN RÉELLE
  const BLOCKCHAIN_RPC = 'http://127.0.0.1:8546';
  const VAULT_ADDRESS = '0x1c85638e118b37167e9298c2268758e058DdfDA0';
  const CONTRACT_ADDRESSES = {
    'CLV': '0xfbC22278A96299D91d41C453234d97b4F5Eb9B2d',
    'ROO': '0x46b142DD1E924FAb83eCc3c08e4D46E82f005e0E',  
    'GOV': '0xC9a43158891282A2B1475592D5719c001986Aaec'
  };

  const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
  ];

  // 🆕 ABI VAULT POUR DEPOSIT
  const VAULT_ABI = [
    "function depositToken(address token, uint256 amount) external",
    "function getUserTokenBalance(address user, address token) view returns (uint256)",
    "function authorizedTokens(address) view returns (bool)",
    "event Deposit(address indexed user, address indexed asset, uint256 amount, bool isNFT)"
  ];

  // Fonction pour afficher notifications
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 8000);
  };

  // Fonction pour vérifier et obtenir token d'authentification
  const ensureAuthentication = async () => {
    const token = localStorage.getItem('authToken');
    if (!token && account) {
      try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: account })
        });
        
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('authToken', data.token);
          return data.token;
        }
      } catch (error) {
        console.error('Auto-login failed:', error);
      }
    }
    return token;
  };

  // 🆕 FONCTION - Créer provider local
  const getProvider = () => {
    try {
      return new ethers.JsonRpcProvider(BLOCKCHAIN_RPC);
    } catch (error) {
      console.error('Error creating provider:', error);
      return null;
    }
  };

  // 🆕 FONCTION - Vérifier si contrat existe
  const checkContractExists = async (address) => {
    try {
      const provider = getProvider();
      if (!provider) return false;
      
      const code = await provider.getCode(address);
      return code !== '0x';
    } catch (error) {
      console.error('Error checking contract:', error);
      return false;
    }
  };

  // 🆕 FONCTION 1 - Approuver tokens vers Vault
  const approveToken = async (tokenAddress, amount) => {
    if (!signer) throw new Error('Wallet non connecté');
    
    try {
      showNotification(`🔍 Vérification du contrat ${symbol}...`, 'info');
      
      // Vérifier que le contrat existe
      const contractExists = await checkContractExists(tokenAddress);
      if (!contractExists) {
        throw new Error(`Contrat ${symbol} non trouvé à l'adresse ${tokenAddress}`);
      }
      
      showNotification(`✅ Contrat trouvé, approbation ${symbol} en cours...`, 'info');
      
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const amountWei = ethers.parseEther(amount.toString());
      
      const tx = await tokenContract.approve(VAULT_ADDRESS, amountWei);
      
      showNotification('⏳ Transaction d\'approbation MetaMask envoyée...', 'info');
      const receipt = await tx.wait();
      showNotification(`✅ Approbation confirmée ! Block: ${receipt.blockNumber}`, 'success');
      
      return receipt;
    } catch (error) {
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction annulée par l\'utilisateur');
      }
      throw new Error(`Approbation échouée: ${error.message}`);
    }
  };

  // 🆕 FONCTION 2 - Déposer tokens dans Vault (VRAIE TRANSACTION)
  const depositToVault = async (tokenAddress, amount) => {
    if (!signer) throw new Error('Wallet non connecté');
    
    try {
      showNotification(`🏦 Dépôt vers Vault: ${amount} ${symbol}...`, 'info');
      
      // Vérifier que le vault existe
      const vaultExists = await checkContractExists(VAULT_ADDRESS);
      if (!vaultExists) {
        throw new Error(`Vault contract non trouvé à l'adresse ${VAULT_ADDRESS}`);
      }
      
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const amountWei = ethers.parseEther(amount.toString());
      
      console.log(`🔗 Calling vault.depositToken():`);
      console.log(`   Token: ${tokenAddress}`);
      console.log(`   Amount: ${amountWei.toString()} wei`);
      console.log(`   User: ${account}`);
      
      // 🆕 VRAIE TRANSACTION BLOCKCHAIN !
      const tx = await vaultContract.depositToken(tokenAddress, amountWei);
      
      showNotification('⏳ Transaction de dépôt MetaMask envoyée...', 'info');
      const receipt = await tx.wait();
      
      showNotification(`✅ Dépôt vault confirmé ! TX: ${receipt.hash.slice(0,10)}...`, 'success');
      
      console.log(`✅ REAL vault deposit completed:`);
      console.log(`   TX Hash: ${receipt.hash}`);
      console.log(`   Block: ${receipt.blockNumber}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      
      return receipt;
    } catch (error) {
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction de dépôt annulée par l\'utilisateur');
      }
      throw new Error(`Dépôt vault échoué: ${error.message}`);
    }
  };

  // Fonction pour vérifier allowance
  const checkAllowance = async (tokenAddress, amount) => {
    if (!signer || !account) return false;
    
    try {
      const provider = getProvider();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const allowance = await tokenContract.allowance(account, VAULT_ADDRESS);
      const requiredAmount = ethers.parseEther(amount.toString());
      
      const hasAllowance = allowance >= requiredAmount;
      
      console.log(`Allowance check: ${ethers.formatEther(allowance)} vs ${amount} required`);
      return hasAllowance;
      
    } catch (error) {
      console.error('Error checking allowance:', error);
      return false;
    }
  };

  // 🆕 FONCTION PRINCIPALE - handleSellOrder avec 2 transactions blockchain
  const handleSellOrder = async (type = 'market') => {
    if (!account || !kycCompleted) {
      showNotification('❌ Veuillez vous connecter et compléter votre KYC', 'error');
      return;
    }

    const quantity = parseFloat(sellForm.quantity);
    const price = type === 'market' ? currentPrice : parseFloat(sellForm.price);

    if (!quantity || quantity <= 0) {
      showNotification('❌ Veuillez entrer une quantité valide', 'error');
      return;
    }

    setIsTrading(true);

    try {
      const tokenAddress = CONTRACT_ADDRESSES[symbol];
      if (!tokenAddress) {
        throw new Error(`Adresse contrat inconnue pour ${symbol}`);
      }

      showNotification(`🚀 Démarrage ordre BLOCKCHAIN RÉEL: ${quantity} ${symbol} à ${price} TRG`, 'info');

      // 🆕 ÉTAPE 1: Approbation (TRANSACTION 1)
      showNotification(`📋 Étape 1/4: Vérification des approbations...`, 'info');
      const hasAllowance = await checkAllowance(tokenAddress, quantity);
      
      if (!hasAllowance) {
        showNotification(`🔐 TRANSACTION 1: Approbation ${quantity} ${symbol}...`, 'info');
        await approveToken(tokenAddress, quantity);
      } else {
        showNotification(`✅ Approbation existante suffisante !`, 'success');
      }

      // 🆕 ÉTAPE 2: Dépôt vers Vault (TRANSACTION 2)
      showNotification(`🏦 TRANSACTION 2: Dépôt vers Vault...`, 'info');
      const depositReceipt = await depositToVault(tokenAddress, quantity);

      // ÉTAPE 3: Créer ordre en DB
      showNotification(`📝 Étape 3/4: Création de l'ordre...`, 'info');
      
      const token = await ensureAuthentication();
      const orderData = {
        pair: `${symbol}/TRG`,
        type: 'SELL',
        quantity: quantity.toString(),
        price: price.toString(),
        vaultTxHash: depositReceipt.hash // Inclure hash de la transaction vault
      };

      const response = await fetch('http://localhost:3001/api/trading/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.status === 'OK') {
        showNotification(`✅ Ordre créé ! ID: ${result.order.id}`, 'success');
        
        // ÉTAPE 4: Finalisation
        showNotification(`🔄 Étape 4/4: Finalisation...`, 'info');
        
        setSellForm({ quantity: '', price: '', type: 'market' });
        await loadAssetData();
        
        showNotification(`🎉 ORDRE BLOCKCHAIN RÉEL TERMINÉ ! TX: ${depositReceipt.hash.slice(0,10)}...`, 'success');
        
      } else {
        throw new Error(result.error || 'Échec création ordre');
      }

    } catch (error) {
      console.error('❌ Erreur ordre blockchain:', error);
      
      if (error.message.includes('annulée')) {
        showNotification('❌ Transaction annulée par l\'utilisateur', 'error');
      } else if (error.message.includes('contrat')) {
        showNotification(`❌ Problème contrat: ${error.message}`, 'error');
      } else {
        showNotification(`❌ Erreur: ${error.message}`, 'error');
      }
      
    } finally {
      setIsTrading(false);
    }
  };

  // Fonction handleBuyOrder (simplifiée)
  const handleBuyOrder = async (type = 'market') => {
    if (!account || !kycCompleted) {
      showNotification('❌ Veuillez vous connecter et compléter votre KYC', 'error');
      return;
    }

    const quantity = parseFloat(buyForm.quantity);
    const price = type === 'market' ? currentPrice : parseFloat(buyForm.price);

    if (!quantity || quantity <= 0) {
      showNotification('❌ Veuillez entrer une quantité valide', 'error');
      return;
    }

    setIsTrading(true);

    try {
      showNotification(`🛒 Création ordre d'achat: ${quantity} ${symbol}...`, 'info');
      
      const token = await ensureAuthentication();
      const orderData = {
        pair: `${symbol}/TRG`,
        type: 'BUY',
        quantity: quantity.toString(),
        price: price.toString()
      };

      const response = await fetch('http://localhost:3001/api/trading/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.status === 'OK') {
        showNotification(`✅ Ordre d'achat créé ! ID: ${result.order.id}`, 'success');
        
        setBuyForm({ quantity: '', price: '', type: 'market' });
        await loadAssetData();
        
      } else {
        throw new Error(result.error || 'Échec création ordre d\'achat');
      }

    } catch (error) {
      console.error('❌ Erreur ordre d\'achat:', error);
      showNotification(`❌ Erreur: ${error.message}`, 'error');
      
    } finally {
      setIsTrading(false);
    }
  };

  // Fonction pour charger données asset
  const loadAssetData = async () => {
    try {
      // Charger infos asset
      const assetResponse = await fetch(`http://localhost:3001/api/assets/${symbol}`);
      if (assetResponse.ok) {
        const assetData = await assetResponse.json();
        setAssetData(assetData.data);
      }

      // Charger prix actuel  
      const priceResponse = await fetch(`http://localhost:3001/api/public/trading/price/${symbol}`);
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        setCurrentPrice(parseFloat(priceData.data?.price || 10));
      }

      // Simuler historique des prix
      const mockHistory = [];
      const basePrice = currentPrice;
      for (let i = 0; i < 20; i++) {
        mockHistory.push({
          time: new Date(Date.now() - (19-i) * 1800000).toLocaleTimeString(),
          price: basePrice + (Math.random() - 0.5) * 4
        });
      }
      setPriceHistory(mockHistory);

    } catch (error) {
      console.error('Error loading asset data:', error);
      setError('Failed to load asset data');
    }
  };

  // useEffect
  useEffect(() => {
    if (symbol) {
      loadAssetData();
      setLoading(false);
    }
  }, [symbol]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données de {symbol}...</p>
        </div>
      </div>
    );
  }

  if (error || !assetData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error || `Asset ${symbol} non trouvé`}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
          notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
          'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
            {notification.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{assetData?.name || `${symbol} Token`}</h1>
              <p className="text-gray-600">{symbol} • 🔗 Blockchain Trading Réel</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {currentPrice} TRG
              </div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">Prix en temps réel</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Graphique (gauche) */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Historique des Prix</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Panel trading (droite) */}
          <div className="space-y-6">
            {/* Info balance */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">🔗 Trading Blockchain Réel</h3>
                <Wallet className="h-5 w-5 text-gray-500" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Prix actuel</span>
                  <span className="font-semibold text-lg">{currentPrice} TRG</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Wallet</span>
                  <span className="text-green-600">✅ {account?.slice(0,6)}...{account?.slice(-4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vault</span>
                  <span className="text-blue-600">🏦 {VAULT_ADDRESS.slice(0,6)}...{VAULT_ADDRESS.slice(-4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mode</span>
                  <span className="text-purple-600">🔗 Transactions Réelles</span>
                </div>
              </div>
            </div>

            {/* Formulaire Vente */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ArrowDownIcon className="h-5 w-5 mr-2 text-red-500" />
                Vendre {symbol} (2 Transactions MetaMask)
              </h3>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>🔗 Transactions blockchain réelles :</strong><br/>
                    1️⃣ Approbation {symbol} → Vault<br/>
                    2️⃣ Dépôt {symbol} dans Vault
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité {symbol}
                  </label>
                  <input
                    type="number"
                    value={sellForm.quantity}
                    onChange={(e) => setSellForm({...sellForm, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`Ex: 4 ${symbol}`}
                    disabled={isTrading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (TRG)
                  </label>
                  <input
                    type="number"
                    value={sellForm.price}
                    onChange={(e) => setSellForm({...sellForm, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`Ex: 9 TRG (actuel: ${currentPrice})`}
                    disabled={isTrading}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleSellOrder('limit')}
                    disabled={isTrading || !account || !kycCompleted}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-sm"
                  >
                    {isTrading ? '⏳ Processing Blockchain...' : '🔗 VENDRE BLOCKCHAIN'}
                  </button>
                  <button
                    onClick={() => handleSellOrder('market')}
                    disabled={isTrading || !account || !kycCompleted}
                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-sm"
                  >
                    {isTrading ? '⏳ Processing...' : '⚡ MARCHÉ'}
                  </button>
                </div>
              </div>
            </div>

            {/* Formulaire Achat */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ArrowUpIcon className="h-5 w-5 mr-2 text-green-500" />
                Acheter {symbol}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité {symbol}
                  </label>
                  <input
                    type="number"
                    value={buyForm.quantity}
                    onChange={(e) => setBuyForm({...buyForm, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Quantité à acheter"
                    disabled={isTrading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (TRG)
                  </label>
                  <input
                    type="number"
                    value={buyForm.price}
                    onChange={(e) => setBuyForm({...buyForm, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder={`Prix actuel: ${currentPrice} TRG`}
                    disabled={isTrading}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleBuyOrder('limit')}
                    disabled={isTrading || !account || !kycCompleted}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                  >
                    {isTrading ? '⏳ Processing...' : '🔗 Acheter'}
                  </button>
                  <button
                    onClick={() => handleBuyOrder('market')}
                    disabled={isTrading || !account || !kycCompleted}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                  >
                    {isTrading ? '⏳ Processing...' : '⚡ Marché'}
                  </button>
                </div>
              </div>
            </div>

            {/* Message connexion */}
            {(!account || !kycCompleted) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      {!account ? '🔗 Connectez votre wallet pour faire des transactions blockchain' : '📋 Complétez votre KYC pour trader'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetPage;
