  const loadBalances = async () => {
    if (!account?.token) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/trading/balances', {
        headers: { 'Authorization': `Bearer ${account.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('🔍 API Balance Response:', data);
        
        // ✅ CORRECTION - Stocker directement les données de l'API
        setBalances({
          wallet: data.walletBalances || {},
          vault: data.vaultBalances || {}
        });
        
        console.log('💰 Balances set:', {
          wallet: data.walletBalances,
          vault: data.vaultBalances
        });
      }
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };
