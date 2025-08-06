// Dans handleSellOrder, ajouter cette logique au début :

const walletBalance = parseFloat(balances.wallet?.[symbol]?.formatted || '0');
const vaultBalance = parseFloat(balances.vault?.[symbol]?.formatted || '0');

if (walletBalance === 0 && vaultBalance >= parseFloat(quantity)) {
  // ✅ VENTE DIRECTE DEPUIS VAULT - PAS DE METAMASK
  setIsTrading(true);
  
  try {
    showNotification(`🏦 Vente depuis vault: ${quantity} ${symbol}`, 'info');
    showNotification(`📝 Création de l'ordre...`, 'info');
    
    const token = await ensureAuthentication();
    const orderData = {
      type: 'SELL',
      quantity: quantity.toString(),
      price: price.toString(),
      fromVault: true
    };

    const response = await fetch(`http://localhost:3001/api/trading/order/${symbol}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (result.status === 'OK') {
      showNotification(`✅ Ordre créé depuis vault ! ID: ${result.order.id}`, 'success');
      showNotification(`📊 Status: ${result.order.status} | Remaining: ${result.order.remaining}`, 'info');
      
      setSellForm({ quantity: '', price: '', type: 'market' });
      await loadAssetData();
      await loadBalances();
      
      showNotification(`🎉 VENTE DEPUIS VAULT RÉUSSIE !`, 'success');
      
    } else {
      throw new Error(result.error || 'Erreur création ordre');
    }
    
  } catch (error) {
    console.error('❌ Erreur ordre vault:', error);
    showNotification(`❌ Erreur: ${error.message}`, 'error');
  } finally {
    setIsTrading(false);
  }
  
  return; // ✅ SORTIR - Pas de transactions MetaMask
}

// Sinon continuer avec la logique normale pour wallet → vault → ordre
