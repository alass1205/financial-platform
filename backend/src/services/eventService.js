const web3Service = require('./web3Service');

class EventService {
  constructor() {
    this.listeners = new Map();
    this.isListening = false;
  }

  async startListening() {
    if (this.isListening) {
      console.log('⚠️ Event service already listening');
      return;
    }

    try {
      console.log('👂 Starting blockchain event listeners...');

      // Écouter les transferts TRG
      this.listeners.set('TRG_Transfer', 
        web3Service.contracts.TRG.on('Transfer', (from, to, amount, event) => {
          this.handleTransfer('TRG', from, to, amount, event);
        })
      );

      // Écouter les transferts CLV
      this.listeners.set('CLV_Transfer',
        web3Service.contracts.CLV.on('Transfer', (from, to, amount, event) => {
          this.handleTransfer('CLV', from, to, amount, event);
        })
      );

      // Écouter les transferts ROO
      this.listeners.set('ROO_Transfer',
        web3Service.contracts.ROO.on('Transfer', (from, to, amount, event) => {
          this.handleTransfer('ROO', from, to, amount, event);
        })
      );

      // Écouter les transferts GOV (NFT)
      this.listeners.set('GOV_Transfer',
        web3Service.contracts.GOV.on('Transfer', (from, to, tokenId, event) => {
          this.handleNFTTransfer('GOV', from, to, tokenId, event);
        })
      );

      this.isListening = true;
      console.log('✅ Event listeners started successfully');

    } catch (error) {
      console.error('❌ Failed to start event listeners:', error);
      throw error;
    }
  }

  handleTransfer(symbol, from, to, amount, event) {
    console.log(`📊 ${symbol} Transfer detected:`);
    console.log(`   From: ${from}`);
    console.log(`   To: ${to}`);
    console.log(`   Amount: ${amount.toString()}`);
    console.log(`   Block: ${event.blockNumber}`);
    console.log(`   Tx: ${event.transactionHash}`);

    // TODO: Mettre à jour la base de données
    this.updateBalanceInDB(from, symbol, amount, 'subtract');
    this.updateBalanceInDB(to, symbol, amount, 'add');
  }

  handleNFTTransfer(symbol, from, to, tokenId, event) {
    console.log(`🖼️ ${symbol} NFT Transfer detected:`);
    console.log(`   From: ${from}`);
    console.log(`   To: ${to}`);
    console.log(`   Token ID: ${tokenId.toString()}`);
    console.log(`   Block: ${event.blockNumber}`);
    console.log(`   Tx: ${event.transactionHash}`);

    // TODO: Mettre à jour la base de données pour NFT
  }

  async updateBalanceInDB(address, symbol, amount, operation) {
    try {
      // Pour l'instant, on log juste. On implémentera la DB plus tard
      console.log(`🔄 Update balance in DB: ${address} ${symbol} ${operation} ${amount.toString()}`);
      
      // TODO: Implémenter la mise à jour réelle en base de données
    } catch (error) {
      console.error('❌ Error updating balance in DB:', error);
    }
  }

  stopListening() {
    if (!this.isListening) {
      console.log('⚠️ Event service not listening');
      return;
    }

    console.log('🛑 Stopping event listeners...');
    
    // Arrêter tous les listeners
    for (const [key, listener] of this.listeners) {
      try {
        listener.removeAllListeners();
        console.log(`✅ Stopped listener: ${key}`);
      } catch (error) {
        console.error(`❌ Error stopping listener ${key}:`, error);
      }
    }

    this.listeners.clear();
    this.isListening = false;
    console.log('✅ All event listeners stopped');
  }

  getListenerStatus() {
    return {
      isListening: this.isListening,
      activeListeners: Array.from(this.listeners.keys()),
      count: this.listeners.size
    };
  }
}

const eventService = new EventService();
module.exports = eventService;
