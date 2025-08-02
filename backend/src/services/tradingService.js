const { PrismaClient } = require('@prisma/client');
const web3Service = require('./web3Service');
const eventService = require('./eventService');

const prisma = new PrismaClient();

class TradingService {
  constructor() {
    this.isInitialized = false;
    this.orderBook = new Map(); // Cache des ordres actifs
    this.tradingPairs = ['CLV/TRG', 'ROO/TRG', 'GOV/TRG']; // Paires de trading
  }

  async initialize() {
    try {
      console.log('⏳ Initializing Trading Service...');
      
      // Charger les ordres actifs depuis la DB
      await this.loadActiveOrders();
      
      // Démarrer le matching automatique
      this.startMatchingEngine();
      
      this.isInitialized = true;
      console.log('✅ Trading Service initialized successfully');
    } catch (error) {
      console.error('❌ Trading Service initialization failed:', error);
      throw error;
    }
  }

  async loadActiveOrders() {
    try {
      const activeOrders = await prisma.order.findMany({
        where: {
          status: { in: ['OPEN', 'PARTIALLY_FILLED'] }
        },
        include: {
          user: { select: { address: true, name: true } },
          asset: { select: { symbol: true, name: true } }
        },
        orderBy: { createdAt: 'asc' } // FIFO
      });

      // Organiser par paire de trading
      this.orderBook.clear();
      for (const order of activeOrders) {
        const pair = `${order.asset.symbol}/TRG`;
        if (!this.orderBook.has(pair)) {
          this.orderBook.set(pair, { buy: [], sell: [] });
        }
        this.orderBook.get(pair)[order.type.toLowerCase()].push(order);
      }

      console.log(`📖 Loaded ${activeOrders.length} active orders into order book`);
    } catch (error) {
      console.error('❌ Error loading active orders:', error);
      throw error;
    }
  }

  async createOrder(userId, orderData) {
    try {
      const { assetSymbol, type, price, quantity } = orderData;
      
      // Validation des données
      await this.validateOrder(userId, orderData);
      
      // Obtenir l'asset
      const asset = await prisma.asset.findUnique({
        where: { symbol: assetSymbol }
      });
      
      if (!asset) {
        throw new Error(`Asset ${assetSymbol} not found`);
      }

      // Créer l'ordre en base
      const order = await prisma.order.create({
        data: {
          userId,
          assetId: asset.id,
          type: type.toUpperCase(),
          price: price.toString(),
          quantity: quantity.toString(),
          remaining: quantity.toString(),
          status: 'OPEN'
        },
        include: {
          user: { select: { address: true, name: true } },
          asset: { select: { symbol: true, name: true } }
        }
      });

      // Réserver les fonds
      await this.reserveFunds(userId, order);

      // Ajouter à l'order book
      const pair = `${assetSymbol}/TRG`;
      if (!this.orderBook.has(pair)) {
        this.orderBook.set(pair, { buy: [], sell: [] });
      }
      this.orderBook.get(pair)[type.toLowerCase()].push(order);

      console.log(`📝 Order created: ${order.type} ${order.quantity} ${assetSymbol} at ${order.price} TRG`);

      // Déclencher le matching
      await this.matchOrders(pair);

      return order;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  async validateOrder(userId, orderData) {
    const { assetSymbol, type, price, quantity } = orderData;

    // Validations de base
    if (!assetSymbol || !type || !price || !quantity) {
      throw new Error('Missing required order parameters');
    }

    if (!['BUY', 'SELL'].includes(type.toUpperCase())) {
      throw new Error('Order type must be BUY or SELL');
    }

    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);

    if (priceNum <= 0 || quantityNum <= 0) {
      throw new Error('Price and quantity must be positive');
    }

    // Vérifier les balances
    if (type.toUpperCase() === 'BUY') {
      // Pour acheter, il faut avoir assez de TRG
      const trgNeeded = (priceNum * quantityNum).toString();
      await this.checkBalance(userId, 'TRG', trgNeeded);
    } else {
      // Pour vendre, il faut avoir assez de l'asset
      await this.checkBalance(userId, assetSymbol, quantity.toString());
    }
  }

  async checkBalance(userId, assetSymbol, amountNeeded) {
    const asset = await prisma.asset.findUnique({
      where: { symbol: assetSymbol }
    });

    if (!asset) {
      throw new Error(`Asset ${assetSymbol} not found`);
    }

    const balance = await prisma.balance.findUnique({
      where: { 
        userId_assetId: {
          userId,
          assetId: asset.id
        }
      }
    });

    if (!balance || parseFloat(balance.available) < parseFloat(amountNeeded)) {
      throw new Error(`Insufficient ${assetSymbol} balance`);
    }
  }

  async reserveFunds(userId, order) {
    try {
      if (order.type === 'BUY') {
        // Réserver des TRG
        const trgAmount = (parseFloat(order.price) * parseFloat(order.quantity)).toString();
        await this.updateBalance(userId, 'TRG', trgAmount, 'reserve');
      } else {
        // Réserver l'asset à vendre
        await this.updateBalance(userId, order.asset.symbol, order.quantity, 'reserve');
      }
    } catch (error) {
      console.error('❌ Error reserving funds:', error);
      throw error;
    }
  }

  async updateBalance(userId, assetSymbol, amount, operation) {
    const asset = await prisma.asset.findUnique({
      where: { symbol: assetSymbol }
    });

    const balance = await prisma.balance.findUnique({
      where: { 
        userId_assetId: {
          userId,
          assetId: asset.id
        }
      }
    });

    if (!balance) {
      throw new Error(`Balance not found for ${assetSymbol}`);
    }

    const amountFloat = parseFloat(amount);
    const availableFloat = parseFloat(balance.available);
    const reservedFloat = parseFloat(balance.reserved);

    let newAvailable, newReserved;

    switch (operation) {
      case 'reserve':
        newAvailable = availableFloat - amountFloat;
        newReserved = reservedFloat + amountFloat;
        break;
      case 'unreserve':
        newAvailable = availableFloat + amountFloat;
        newReserved = reservedFloat - amountFloat;
        break;
      case 'add':
        newAvailable = availableFloat + amountFloat;
        newReserved = reservedFloat;
        break;
      case 'subtract':
        newReserved = reservedFloat - amountFloat;
        newAvailable = availableFloat;
        break;
      default:
        throw new Error(`Unknown balance operation: ${operation}`);
    }

    if (newAvailable < 0 || newReserved < 0) {
      throw new Error('Insufficient balance for operation');
    }

    await prisma.balance.update({
      where: { id: balance.id },
      data: {
        available: newAvailable.toString(),
        reserved: newReserved.toString(),
        total: (newAvailable + newReserved).toString()
      }
    });
  }

  async matchOrders(pair) {
    try {
      const orders = this.orderBook.get(pair);
      if (!orders || orders.buy.length === 0 || orders.sell.length === 0) {
        return; // Pas assez d'ordres pour matcher
      }

      // Trier les ordres (FIFO pour même prix)
      orders.buy.sort((a, b) => parseFloat(b.price) - parseFloat(a.price) || new Date(a.createdAt) - new Date(b.createdAt));
      orders.sell.sort((a, b) => parseFloat(a.price) - parseFloat(b.price) || new Date(a.createdAt) - new Date(b.createdAt));

      let matched = true;
      while (matched && orders.buy.length > 0 && orders.sell.length > 0) {
        const buyOrder = orders.buy[0];
        const sellOrder = orders.sell[0];

        // Vérifier si les prix se croisent
        if (parseFloat(buyOrder.price) >= parseFloat(sellOrder.price)) {
          await this.executeTrade(buyOrder, sellOrder);
          matched = true;
        } else {
          matched = false;
        }
      }
    } catch (error) {
      console.error('❌ Error in order matching:', error);
    }
  }

  async executeTrade(buyOrder, sellOrder) {
    try {
      // Calculer la quantité à échanger
      const buyRemaining = parseFloat(buyOrder.remaining);
      const sellRemaining = parseFloat(sellOrder.remaining);
      const tradeQuantity = Math.min(buyRemaining, sellRemaining);
      
      // Prix d'exécution (prix du sell order, FIFO)
      const tradePrice = parseFloat(sellOrder.price);
      const totalValue = tradeQuantity * tradePrice;

      console.log(`🔄 Executing trade: ${tradeQuantity} ${buyOrder.asset.symbol} at ${tradePrice} TRG`);

      // Créer le trade en base
      const trade = await prisma.trade.create({
        data: {
          buyOrderId: buyOrder.id,
          sellOrderId: sellOrder.id,
          buyerId: buyOrder.userId,
          sellerId: sellOrder.userId,
          assetId: buyOrder.assetId,
          price: tradePrice.toString(),
          quantity: tradeQuantity.toString()
        }
      });

      // Mettre à jour les ordres
      await this.updateOrderAfterTrade(buyOrder, tradeQuantity);
      await this.updateOrderAfterTrade(sellOrder, tradeQuantity);

      // Transférer les fonds
      await this.transferFunds(buyOrder, sellOrder, tradeQuantity, totalValue);

      // Mettre à jour l'order book
      await this.updateOrderBook(buyOrder, sellOrder, tradeQuantity);

      console.log(`✅ Trade executed: ${trade.id}`);
      return trade;
    } catch (error) {
      console.error('❌ Error executing trade:', error);
      throw error;
    }
  }

  async updateOrderAfterTrade(order, tradedQuantity) {
    const newRemaining = parseFloat(order.remaining) - tradedQuantity;
    const newFilled = parseFloat(order.filled) + tradedQuantity;
    
    let newStatus = 'OPEN';
    if (newRemaining === 0) {
      newStatus = 'FILLED';
    } else if (newFilled > 0) {
      newStatus = 'PARTIALLY_FILLED';
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        remaining: newRemaining.toString(),
        filled: newFilled.toString(),
        status: newStatus
      }
    });

    // Mettre à jour l'objet en mémoire
    order.remaining = newRemaining.toString();
    order.filled = newFilled.toString();
    order.status = newStatus;
  }

  async transferFunds(buyOrder, sellOrder, quantity, totalValue) {
    // L'acheteur reçoit l'asset, perd les TRG réservés
    await this.updateBalance(buyOrder.userId, buyOrder.asset.symbol, quantity.toString(), 'add');
    await this.updateBalance(buyOrder.userId, 'TRG', totalValue.toString(), 'subtract');

    // Le vendeur reçoit les TRG, perd l'asset réservé  
    await this.updateBalance(sellOrder.userId, 'TRG', totalValue.toString(), 'add');
    await this.updateBalance(sellOrder.userId, sellOrder.asset.symbol, quantity.toString(), 'subtract');
  }

  async updateOrderBook(buyOrder, sellOrder, tradedQuantity) {
    const pair = `${buyOrder.asset.symbol}/TRG`;
    const orders = this.orderBook.get(pair);

    // Retirer les ordres complètement remplis
    if (parseFloat(buyOrder.remaining) === 0) {
      const index = orders.buy.findIndex(o => o.id === buyOrder.id);
      if (index > -1) orders.buy.splice(index, 1);
    }

    if (parseFloat(sellOrder.remaining) === 0) {
      const index = orders.sell.findIndex(o => o.id === sellOrder.id);
      if (index > -1) orders.sell.splice(index, 1);
    }
  }

  startMatchingEngine() {
    // Lancer le matching toutes les 5 secondes
    setInterval(() => {
      for (const pair of this.tradingPairs) {
        this.matchOrders(pair);
      }
    }, 5000);
    
    console.log('⚙️ Matching engine started (5s interval)');
  }

  async getOrderBook(pair) {
    const orders = this.orderBook.get(pair);
    if (!orders) return { buy: [], sell: [] };

    return {
      buy: orders.buy.map(o => ({
        price: o.price,
        quantity: o.remaining,
        total: (parseFloat(o.price) * parseFloat(o.remaining)).toFixed(2)
      })),
      sell: orders.sell.map(o => ({
        price: o.price,
        quantity: o.remaining,
        total: (parseFloat(o.price) * parseFloat(o.remaining)).toFixed(2)
      }))
    };
  }

  async getUserOrders(userId, status = null) {
    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    return await prisma.order.findMany({
      where: whereClause,
      include: {
        asset: { select: { symbol: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getUserTrades(userId) {
    return await prisma.trade.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      include: {
        asset: { select: { symbol: true, name: true } },
        buyer: { select: { address: true, name: true } },
        seller: { select: { address: true, name: true } }
      },
      orderBy: { executedAt: 'desc' }
    });
  }

  async cancelOrder(orderId, userId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { asset: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'FILLED' || order.status === 'CANCELLED') {
      throw new Error('Cannot cancel this order');
    }

    // Libérer les fonds réservés
    if (order.type === 'BUY') {
      const trgToUnreserve = (parseFloat(order.price) * parseFloat(order.remaining)).toString();
      await this.updateBalance(userId, 'TRG', trgToUnreserve, 'unreserve');
    } else {
      await this.updateBalance(userId, order.asset.symbol, order.remaining, 'unreserve');
    }

    // Marquer comme annulé
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    // Retirer de l'order book
    const pair = `${order.asset.symbol}/TRG`;
    const orders = this.orderBook.get(pair);
    if (orders) {
      const type = order.type.toLowerCase();
      const index = orders[type].findIndex(o => o.id === orderId);
      if (index > -1) orders[type].splice(index, 1);
    }

    console.log(`❌ Order cancelled: ${orderId}`);
  }
}

const tradingService = new TradingService();
module.exports = tradingService;
