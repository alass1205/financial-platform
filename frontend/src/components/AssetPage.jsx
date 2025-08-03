import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';

const AssetPage = () => {
  const { symbol } = useParams();
  const location = useLocation();
  
  // Extraire le symbol de l'URL si useParams ne fonctionne pas
  const assetSymbol = symbol || location.pathname.split('/').pop();
  
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Prix par défaut selon le cahier des charges
  const defaultPrices = {
    'CLV': 10,
    'ROO': 10, 
    'GOV': 200
  };

  const assetInfo = {
    'CLV': { name: 'Clove Company', type: 'Share', description: 'Actions de Clove Company' },
    'ROO': { name: 'Rooibos Limited', type: 'Share', description: 'Actions de Rooibos Limited' },
    'GOV': { name: 'Government Bonds', type: 'Bond', description: 'Obligations gouvernementales' }
  };

  useEffect(() => {
    if (assetSymbol) {
      loadPriceHistory();
    }
  }, [assetSymbol]);

  const loadPriceHistory = async () => {
    try {
      // Pour l'instant, utilisons des données par défaut
      const defaultData = [
        { time: 1, price: defaultPrices[assetSymbol] || 10, volume: 0 },
        { time: 2, price: defaultPrices[assetSymbol] || 10, volume: 0 },
        { time: 3, price: defaultPrices[assetSymbol] || 10, volume: 0 }
      ];
      
      setPriceHistory(defaultData);
    } catch (error) {
      console.error('Erreur loading price history:', error);
      // Prix par défaut en cas d'erreur
      setPriceHistory([{
        time: 1,
        price: defaultPrices[assetSymbol] || 10,
        volume: 0
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données {assetSymbol}...</p>
        </div>
      </div>
    );
  }

  const currentAsset = assetInfo[assetSymbol];
  const currentPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : defaultPrices[assetSymbol];

  if (!currentAsset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Asset non trouvé</h1>
          <p className="text-gray-600">L'asset {assetSymbol} n'existe pas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentAsset.name} ({assetSymbol})
              </h1>
              <p className="text-gray-600 mt-1">{currentAsset.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {currentPrice} TRG
              </div>
              <div className="text-sm text-gray-500">Prix actuel</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Graphique à gauche */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Évolution du prix</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    label={{ value: 'Temps', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    label={{ value: 'Prix (TRG)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} TRG`, 
                      name === 'price' ? 'Prix' : 'Volume'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Controls à droite */}
          <div className="space-y-6">
            
            {/* Actions rapides */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Trading {assetSymbol}</h2>
              <div className="grid grid-cols-2 gap-4">
                <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                  Acheter au marché
                </button>
                <button className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                  Vendre au marché
                </button>
              </div>
            </div>

            {/* Info asset */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Informations</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{currentAsset.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prix par défaut:</span>
                  <span className="font-medium">{defaultPrices[assetSymbol]} TRG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Symbol:</span>
                  <span className="font-medium">{assetSymbol}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetPage;
