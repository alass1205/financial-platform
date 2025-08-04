import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Dividends = ({ symbol, userAddress }) => {
  const [dividendInfo, setDividendInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Charger les informations de dividendes
  const loadDividendInfo = async () => {
    if (!userAddress || !symbol) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/dividends/available/${symbol}/${userAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setDividendInfo(data.data);
      }
    } catch (error) {
      console.error('Error loading dividend info:', error);
    } finally {
      setLoading(false);
    }
  };

  // Claim des dividendes via MetaMask
  const claimDividends = async () => {
    if (!window.ethereum || !dividendInfo) return;
    
    setClaiming(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Contrat ShareToken ABI minimal
      const contractABI = [
        "function claimDividends()",
        "function availableDividends(address) view returns (uint256)"
      ];
      
      const contract = new ethers.Contract(
        dividendInfo.contractAddress,
        contractABI,
        signer
      );
      
      // Exécuter la transaction
      const tx = await contract.claimDividends();
      console.log('Transaction submitted:', tx.hash);
      
      // Attendre la confirmation
      await tx.wait();
      console.log('Transaction confirmed');
      
      // Recharger les informations
      setTimeout(loadDividendInfo, 2000);
      
      alert(`✅ Dividendes réclamés avec succès !\nTransaction: ${tx.hash}`);
      
    } catch (error) {
      console.error('Error claiming dividends:', error);
      alert(`❌ Erreur lors de la réclamation: ${error.message}`);
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    loadDividendInfo();
  }, [userAddress, symbol]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">💎 Dividendes {symbol}</h3>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!dividendInfo) {
    return null;
  }

  const hasDividends = parseFloat(dividendInfo.availableDividends) > 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">💎 Dividendes {symbol}</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Vos actions:</span>
          <span className="font-semibold">{dividendInfo.userBalance} {symbol}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Dividendes disponibles:</span>
          <span className={`font-semibold ${hasDividends ? 'text-green-600' : 'text-gray-500'}`}>
            {dividendInfo.availableDividends} TRG
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Total distribué:</span>
          <span className="text-gray-700">{dividendInfo.totalDividendsDistributed} TRG</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Par action:</span>
          <span className="text-gray-700">{dividendInfo.dividendsPerShare} TRG</span>
        </div>
      </div>
      
      {hasDividends && (
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={claimDividends}
            disabled={claiming}
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
              claiming
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {claiming ? '⏳ Réclamation...' : `🎯 Réclamer ${dividendInfo.availableDividends} TRG`}
          </button>
        </div>
      )}
      
      {!hasDividends && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-center text-gray-600">
          Aucun dividende disponible pour le moment
        </div>
      )}
      
      <div className="mt-4">
        <button
          onClick={loadDividendInfo}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          🔄 Actualiser
        </button>
      </div>
    </div>
  );
};

export default Dividends;
