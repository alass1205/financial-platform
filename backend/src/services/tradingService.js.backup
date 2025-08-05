const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TradingService {
  constructor() {
    this.orderBook = new Map();
    this.matchingInterval = null;
    this.startMatching();
  }

  startMatching() {
    this.matchingInterval = setInterval(async () => {
      try {
        await this.matchAllPairs();
      } catch (error) {
        console.error('❌ Erreur matching automatique:', error);
      }
    }, 5000);
    
    console.log('🔄 Matching automatique démarré (toutes les 5s)');
  }

  async matchAllPairs() {
    const pairs = ['CLV/TRG', 'ROO/TRG', 'GOV/TRG'];
    for (const pair of pairs) {
      await this.matchOrders(pair);
    }
  }

  async createOrder(userId, orderData) {
    try {
      const { assetSymbol, type, price, quantity } = orderData;
      
      console.log(`📝 Creating order: ${type} ${quantity} ${assetSymbol} at ${price}`);
      
      await this.validateOrder(userId, orderData);

      const asset = await prisma.asset.findUnique({
        where: { symbol: assetSymbol }
      });

      if (!asset) {
        throw new Error(`Asset ${assetSymbol} non trouvé`);
      }

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

      const pair = `${assetSymbol}/TRG`;
      await this.matchOrders(pair);

      console.log(`✅ Order created: ${order.id}`);
      return order;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  async matchOrders(pair) {
    try {
      const [baseToken] = pair.split('/');
      const asset = await prisma.asset.findUnique({
        where: { symbol: baseToken }
      });

      if (!asset) return;

      // Récupérer TOUS les ordres ouverts de la DB
      const openOrders = await prisma.order.findMany({
        where: {
          assetId: asset.id,
          status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
          remaining: { not: "0" }
        },
        include: {
          user: { select: { address: true, name: true } },
          asset: { select: { symbol: true, name: true } }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (openOrders.length < 2) return; // Pas assez d'ordres

      const buyOrders = openOrders
        .filter(o => o.type === 'BUY')
        .sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); // Prix décroissant

      const sellOrders = openOrders
        .filter(o => o.type === 'SELL')
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); // Prix croissant

      console.log(`🔄 Matching ${pair}: ${buyOrders.length} buy orders, ${sellOrders.length} sell orders`);

      // Matching FIFO
      for (const buyOrder of buyOrders) {
        for (const sellOrder of sellOrders) {
          const buyPrice = parseFloat(buyOrder.price);
          const sellPrice = parseFloat(sellOrder.price);
          const buyRemaining = parseFloat(buyOrder.remaining);
          const sellRemaining = parseFloat(sellOrder.remaining);

          if (buyPrice >= sellPrice && buyRemaining > 0 && sellRemaining > 0) {
            console.log(`💰 Match found: BUY ${buyPrice} >= SELL ${sellPrice}`);
            await this.executeTrade(buyOrder, sellOrder);
            
            // Recharger les ordres après le trade pour avoir les bonnes quantités
            const updatedBuyOrder = await prisma.order.findUnique({ where: { id: buyOrder.id } });
            const updatedSellOrder = await prisma.order.findUnique({ where: { id: sellOrder.id } });
            
            buyOrder.remaining = updatedBuyOrder.remaining;
            sellOrder.remaining = updatedSellOrder.remaining;
          }
        }
      }

    } catch (error) {
      console.error(`❌ Erreur matching ${pair}:`, error);
    }
  }

  async executeTrade(buyOrder, sellOrder) {
    try {
      const tradeQuantity = Math.min(parseFloat(buyOrder.remaining), parseFloat(sellOrder.remaining));
      const tradePrice = parseFloat(sellOrder.price);
      const tradeValue = tradeQuantity * tradePrice;

      if (tradeQuantity <= 0) {
        console.log('⚠️ Trade quantity is 0, skipping');
        return;
      }

      console.log(`💰 Executing trade: ${tradeQuantity} ${sellOrder.asset.symbol} at ${tradePrice} TRG (total: ${tradeValue} TRG)`);

      // 1. Créer le trade record
      const trade = await prisma.trade.create({
        data: {
          buyOrderId: buyOrder.id,
          sellOrderId: sellOrder.id,
          buyerId: buyOrder.userId,
          sellerId: sellOrder.userId,
          assetId: buyOrder.assetId,
          price: tradePrice.toString(),
          quantity: tradeQuantity.toString(),
          fee: "0"
        }
      });

      // 2. Mettre à jour les balances
      await this.updateBalancesAfterTrade(buyOrder, sellOrder, tradeQuantity, tradeValue);

      // 3. Mettre à jour les ordres
      await this.updateOrdersAfterTrade(buyOrder, sellOrder, tradeQuantity);

      console.log(`✅ Trade ${trade.id} executed successfully`);

    } catch (error) {
      console.error('❌ Erreur exécution trade:', error);
    }
  }

  async updateBalancesAfterTrade(buyOrder, sellOrder, tradeQuantity, tradeValue) {
    try {
      console.log('🔄 Updating balances...');

      // ACHETEUR: +asset, -TRG
      await this.updateUserBalance(buyOrder.userId, sellOrder.asset.symbol, tradeQuantity, 'ADD');
      await this.updateUserBalance(buyOrder.userId, 'TRG', tradeValue, 'SUBTRACT');

      // VENDEUR: -asset, +TRG
      await this.updateUserBalance(sellOrder.userId, sellOrder.asset.symbol, tradeQuantity, 'SUBTRACT');
      await this.updateUserBalance(sellOrder.userId, 'TRG', tradeValue, 'ADD');

      console.log('✅ Balances updated successfully');

    } catch (error) {
      console.error('❌ Erreur mise à jour balances:', error);
    }
  }

  async updateUserBalance(userId, assetSymbol, amount, operation) {
    try {
      // Validation stricte
      if (!userId || !assetSymbol || !amount || isNaN(amount) || amount <= 0) {
        console.log(`⚠️ Paramètres invalides pour balance update: ${userId}, ${assetSymbol}, ${amount}, ${operation}`);
        return;
      }

      const asset = await prisma.asset.findUnique({
        where: { symbol: assetSymbol }
      });

      if (!asset) {
        console.log(`⚠️ Asset ${assetSymbol} non trouvé`);
        return;
      }

      // Chercher la balance existante
      let balance = await prisma.balance.findUnique({
        where: {
          userId_assetId: {
            userId: userId,
            assetId: asset.id
          }
        }
      });

      const currentTotal = balance ? parseFloat(balance.total || "0") : 0;
      let newTotal;

      if (operation === 'ADD') {
        newTotal = currentTotal + amount;
      } else if (operation === 'SUBTRACT') {
        newTotal = Math.max(0, currentTotal - amount);
      } else {
        console.log(`⚠️ Opération invalide: ${operation}`);
        return;
      }

      // Validation finale
      if (isNaN(newTotal) || newTotal < 0) {
        console.log(`⚠️ Résultat invalide: ${newTotal}`);
        return;
      }

      // Mettre à jour ou créer la balance
      if (balance) {
        await prisma.balance.update({
          where: { id: balance.id },
          data: { 
            available: newTotal.toString(),
            total: newTotal.toString(),
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.balance.create({
          data: {
            userId: userId,
            assetId: asset.id,
            available: newTotal.toString(),
            reserved: "0",
            total: newTotal.toString()
          }
        });
      }

      console.log(`💰 Balance ${assetSymbol}: ${currentTotal} ${operation} ${amount} = ${newTotal}`);

    } catch (error) {
      console.error(`❌ Erreur update balance ${assetSymbol}:`, error);
    }
  }

  async updateOrdersAfterTrade(buyOrder, sellOrder, tradeQuantity) {
    try {
      // Mettre à jour l'ordre d'achat
      const newBuyRemaining = Math.max(0, parseFloat(buyOrder.remaining) - tradeQuantity);
      const newBuyFilled = parseFloat(buyOrder.filled || 0) + tradeQuantity;
      
      await prisma.order.update({
        where: { id: buyOrder.id },
        data: {
          filled: newBuyFilled.toString(),
          remaining: newBuyRemaining.toString(),
          status: newBuyRemaining > 0 ? 'PARTIALLY_FILLED' : 'FILLED'
        }
      });

      // Mettre à jour l'ordre de vente
      const newSellRemaining = Math.max(0, parseFloat(sellOrder.remaining) - tradeQuantity);
      const newSellFilled = parseFloat(sellOrder.filled || 0) + tradeQuantity;
      
      await prisma.order.update({
        where: { id: sellOrder.id },
        data: {
          filled: newSellFilled.toString(),
          remaining: newSellRemaining.toString(),
          status: newSellRemaining > 0 ? 'PARTIALLY_FILLED' : 'FILLED'
        }
      });

      console.log(`📝 Orders updated: Buy=${newBuyRemaining}, Sell=${newSellRemaining}`);

    } catch (error) {
      console.error('❌ Erreur update orders:', error);
    }
  }

  async validateOrder(userId, orderData) {
    const { assetSymbol, type, price, quantity } = orderData;

    if (!assetSymbol || !type || !price || !quantity) {
      throw new Error('Paramètres manquants');
    }

    if (!['CLV', 'ROO', 'GOV'].includes(assetSymbol.toUpperCase())) {
      throw new Error(`Asset invalide: ${assetSymbol}`);
    }

    if (!['BUY', 'SELL'].includes(type.toUpperCase())) {
      throw new Error(`Type invalide: ${type}`);
    }

    if (parseFloat(price) <= 0 || parseFloat(quantity) <= 0) {
      throw new Error('Prix et quantité doivent être positifs');
    }

    return true;
  }

  async reserveFunds(userId, order) {
    // À implémenter plus tard
    return true;
  }

  async getUserOrders(userId, status = null) {
    const where = { userId };
    if (status) {
      where.status = status.toUpperCase();
    }

    return await prisma.order.findMany({
      where,
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
        asset: { select: { symbol: true, name: true } }
      },
      orderBy: { executedAt: 'desc' }
    });
  }

  async getOrderBook(pair) {
    const [baseToken] = pair.split('/');
    
    const asset = await prisma.asset.findUnique({
      where: { symbol: baseToken }
    });

    if (!asset) {
      return { buy: [], sell: [] };
    }

    const openOrders = await prisma.order.findMany({
      where: {
        assetId: asset.id,
        status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
        remaining: { not: "0" }
      },
      include: {
        user: { select: { address: true } },
        asset: { select: { symbol: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    const buyOrders = openOrders
      .filter(o => o.type === 'BUY')
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    
    const sellOrders = openOrders
      .filter(o => o.type === 'SELL')
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    return {
      buy: buyOrders.map(o => ({
        id: o.id,
        price: o.price,
        quantity: o.remaining,
        total: (parseFloat(o.price) * parseFloat(o.remaining)).toFixed(2),
        user: o.user.address.slice(0, 8) + '...'
      })),
      sell: sellOrders.map(o => ({
        id: o.id,
        price: o.price,
        quantity: o.remaining,
        total: (parseFloat(o.price) * parseFloat(o.remaining)).toFixed(2),
        user: o.user.address.slice(0, 8) + '...'
      }))
    };
  }

  async cancelOrder(orderId, userId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId }
    });

    if (!order) {
      throw new Error('Ordre non trouvé');
    }

    if (!['OPEN', 'PARTIALLY_FILLED'].includes(order.status)) {
      throw new Error('Impossible d\'annuler cet ordre');
    }

    return await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });
  }

  async getTradingStats() {
    try {
      const totalTrades = await prisma.trade.count();
      const totalOrders = await prisma.order.count();

      return {
        totalTrades,
        totalOrders,
        totalVolume: 0
      };
    } catch (error) {
      console.error('❌ Erreur stats:', error);
      return { totalTrades: 0, totalOrders: 0, totalVolume: 0 };
    }
  }
}

module.exports = new TradingService();
