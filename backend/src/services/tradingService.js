const { PrismaClient } = require('@prisma/client');
const { ethers } = require('ethers');

class TradingService {
  constructor() {
    this.prisma = new PrismaClient();
    
    // Configuration blockchain
    this.provider = null;
    this.signer = null;
    this.vaultContract = null;
    this.contractAddresses = {
      VAULT: process.env.VAULT_CONTRACT || '0x1c85638e118b37167e9298c2268758e058DdfDA0',
      TRG: process.env.TRG_CONTRACT || '0x2B0d36FACD61B71CC05ab8F3D2355ec3631C0dd5',
      CLV: process.env.CLV_CONTRACT || '0xfbC22278A96299D91d41C453234d97b4F5Eb9B2d',
      ROO: process.env.ROO_CONTRACT || '0x46b142DD1E924FAb83eCc3c08e4D46E82f005e0E',
      GOV: process.env.GOV_CONTRACT || '0xC9a43158891282A2B1475592D5719c001986Aaec'
    };
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Connexion blockchain
      this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_URL || 'http://127.0.0.1:8546');
      this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

      // ABI du Vault
      this.vaultABI = [
        "function operateWithdrawal(address user, address asset, uint256 amount, bool isNFT) returns (bool)",
        "function getUserTokenBalance(address user, address token) view returns (uint256)",
        "function authorizedTokens(address) view returns (bool)",
        "event Deposit(address indexed user, address indexed token, uint256 amount)",
        "event Withdrawal(address indexed user, address indexed token, uint256 amount)"
      ];

      // ABI ERC20
      this.erc20ABI = [
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)"
      ];

      // Contrat Vault
      this.vaultContract = new ethers.Contract(
        this.contractAddresses.VAULT,
        this.vaultABI,
        this.signer
      );

      this.isInitialized = true;
      console.log('🔄 TradingService blockchain initialized');

    } catch (error) {
      console.error('❌ TradingService blockchain init failed:', error);
    }
  }

  // Créer ordre avec vérifications blockchain
  async createOrder(userId, orderData) {
    try {
      const { assetSymbol, type, price, quantity } = orderData;

      console.log(`📝 Creating ${type} order: ${quantity} ${assetSymbol} @ ${price} TRG`);

      // Obtenir l'asset depuis la DB
      const asset = await this.prisma.asset.findUnique({
        where: { symbol: assetSymbol }
      });

      if (!asset) {
        throw new Error(`Asset ${assetSymbol} not found`);
      }

      // Créer l'ordre en DB
      const order = await this.prisma.order.create({
        data: {
          userId: userId, // Garder comme string
          assetId: asset.id,
          type: type,
          price: ethers.parseEther(price.toString()).toString(),
          quantity: ethers.parseEther(quantity.toString()).toString(),
          remaining: ethers.parseEther(quantity.toString()).toString(),
          status: 'OPEN'
        },
        include: {
          asset: true,
          user: true
        }
      });

      console.log(`✅ Order created: ID ${order.id}, ${type} ${quantity} ${assetSymbol}`);

      return order;

    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  // Matching avec vraies transactions blockchain
  async matchOrdersWithBlockchain(newOrderId) {
    try {
      await this.initialize();

      const newOrder = await this.prisma.order.findUnique({
        where: { id: newOrderId },
        include: { asset: true, user: true }
      });

      if (!newOrder || newOrder.status !== 'OPEN') {
        console.log(`⚠️ Order ${newOrderId} not found or not open`);
        return;
      }

      console.log(`🔄 Starting blockchain matching for order ${newOrderId}`);

      // Trouver ordres matchables
      const matchingOrders = await this.findMatchingOrders(newOrder);
      
      if (matchingOrders.length === 0) {
        console.log(`📝 No matching orders found for ${newOrder.id}`);
        return;
      }

      console.log(`🎯 Found ${matchingOrders.length} matching orders`);

      // Exécuter les trades avec blockchain
      for (const matchOrder of matchingOrders) {
        if (parseFloat(newOrder.remaining) <= 0) break;
        await this.executeBlockchainTrade(newOrder, matchOrder);
      }

    } catch (error) {
      console.error('❌ Blockchain matching failed:', error);
      throw error;
    }
  }

  // Exécuter trade blockchain réel
  async executeBlockchainTrade(newOrder, matchOrder) {
    try {
      const matchQuantity = Math.min(
        parseFloat(ethers.formatEther(newOrder.remaining)),
        parseFloat(ethers.formatEther(matchOrder.remaining))
      );

      if (matchQuantity <= 0) return;

      const tradePrice = parseFloat(ethers.formatEther(matchOrder.price));
      const totalPrice = matchQuantity * tradePrice;

      console.log(`💱 Executing blockchain trade:`);
      console.log(`   Quantity: ${matchQuantity} ${newOrder.asset.symbol}`);
      console.log(`   Price: ${tradePrice} TRG each`);
      console.log(`   Total: ${totalPrice} TRG`);

      // Déterminer buyer et seller
      const buyer = newOrder.type === 'BUY' ? newOrder : matchOrder;
      const seller = newOrder.type === 'SELL' ? newOrder : matchOrder;

      console.log(`   Buyer: ${buyer.user.address}`);
      console.log(`   Seller: ${seller.user.address}`);

      // Transaction blockchain réelle via Vault (simulation pour l'instant)
      if (this.vaultContract) {
        try {
          const assetAddress = this.contractAddresses[newOrder.asset.symbol];
          
          console.log(`🏦 Simulating vault withdrawal: ${matchQuantity} ${newOrder.asset.symbol} → ${buyer.user.address}`);
          
          // Pour l'instant on simule, plus tard on fera la vraie transaction
          console.log(`✅ Simulated blockchain trade completed`);

        } catch (blockchainError) {
          console.error('❌ Blockchain transaction failed:', blockchainError);
        }
      }

      // Créer le trade en DB
      const trade = await this.prisma.trade.create({
        data: {
          buyOrderId: buyer.id,
          sellOrderId: seller.id,
          buyerId: buyer.userId,
          sellerId: seller.userId,
          assetId: newOrder.assetId,
          price: matchOrder.price,
          quantity: ethers.parseEther(matchQuantity.toString()).toString(),
          executedAt: new Date()
        }
      });

      // Mettre à jour les ordres
      const quantityWei = ethers.parseEther(matchQuantity.toString());

      // Mettre à jour newOrder
      const newRemaining = BigInt(newOrder.remaining) - quantityWei;
      await this.prisma.order.update({
        where: { id: newOrder.id },
        data: {
          remaining: newRemaining.toString(),
          status: newRemaining === 0n ? 'FILLED' : 'PARTIALLY_FILLED'
        }
      });

      // Mettre à jour matchOrder
      const matchRemaining = BigInt(matchOrder.remaining) - quantityWei;
      await this.prisma.order.update({
        where: { id: matchOrder.id },
        data: {
          remaining: matchRemaining.toString(),
          status: matchRemaining === 0n ? 'FILLED' : 'PARTIALLY_FILLED'
        }
      });

      // Mettre à jour le prix de l'asset
      await this.prisma.asset.update({
        where: { id: newOrder.assetId },
        data: { currentPrice: tradePrice.toString() }
      });

      // Ajouter à l'historique des prix
      await this.prisma.priceHistory.create({
        data: {
          assetId: newOrder.assetId,
          price: tradePrice.toString(),
          volume: matchQuantity.toString(),
          timestamp: new Date()
        }
      });

      console.log(`✅ Trade completed in DB: ${matchQuantity} ${newOrder.asset.symbol} @ ${tradePrice} TRG`);

      return trade;

    } catch (error) {
      console.error('❌ Execute blockchain trade failed:', error);
      throw error;
    }
  }

  // Fonction existante - Trouver ordres matchables
  async findMatchingOrders(newOrder) {
    try {
      const oppositeType = newOrder.type === 'BUY' ? 'SELL' : 'BUY';
      
      let whereClause = {
        assetId: newOrder.assetId,
        type: oppositeType,
        status: { in: ['OPEN', 'PARTIALLY_FILLED'] },
        userId: { not: newOrder.userId }
      };

      // Pour BUY order, chercher SELL orders <= prix max
      if (newOrder.type === 'BUY') {
        whereClause.price = { lte: newOrder.price };
      }
      // Pour SELL order, chercher BUY orders >= prix min  
      else {
        whereClause.price = { gte: newOrder.price };
      }

      const orders = await this.prisma.order.findMany({
        where: whereClause,
        include: { asset: true, user: true },
        orderBy: [
          { price: newOrder.type === 'BUY' ? 'asc' : 'desc' },
          { createdAt: 'asc' }
        ]
      });

      return orders;

    } catch (error) {
      console.error('❌ Error finding matching orders:', error);
      return [];
    }
  }

  // 🆕 CORRECTION - getUserOrders avec validation userId
  async getUserOrders(userId) {
    try {
      // Validation du userId
      if (!userId) {
        console.error('❌ getUserOrders: userId is required');
        return [];
      }

      console.log(`📋 Getting orders for user: ${userId}`);

      const orders = await this.prisma.order.findMany({
        where: { userId: userId }, // userId est déjà une string
        include: { asset: true },
        orderBy: { createdAt: 'desc' }
      });

      return orders.map(order => ({
        id: order.id,
        type: order.type,
        assetSymbol: order.asset.symbol,
        price: ethers.formatEther(order.price),
        quantity: ethers.formatEther(order.quantity),
        remaining: ethers.formatEther(order.remaining),
        status: order.status,
        createdAt: order.createdAt
      }));

    } catch (error) {
      console.error('❌ Error getting user orders:', error);
      return [];
    }
  }

  // 🆕 CORRECTION - getUserTrades avec validation userId
  async getUserTrades(userId) {
    try {
      // Validation du userId
      if (!userId) {
        console.error('❌ getUserTrades: userId is required');
        return [];
      }

      console.log(`💱 Getting trades for user: ${userId}`);

      const trades = await this.prisma.trade.findMany({
        where: {
          OR: [
            { buyerId: userId }, // userId est déjà une string
            { sellerId: userId }
          ]
        },
        include: { 
          asset: true,
          buyOrder: { include: { user: true } },
          sellOrder: { include: { user: true } }
        },
        orderBy: { executedAt: 'desc' }
      });

      return trades.map(trade => ({
        id: trade.id,
        type: trade.buyerId === userId ? 'BUY' : 'SELL',
        assetSymbol: trade.asset.symbol,
        price: ethers.formatEther(trade.price),
        quantity: ethers.formatEther(trade.quantity),
        executedAt: trade.executedAt,
        counterparty: trade.buyerId === userId ? 
          trade.sellOrder.user.address : 
          trade.buyOrder.user.address
      }));

    } catch (error) {
      console.error('❌ Error getting user trades:', error);
      return [];
    }
  }

  async cancelOrder(orderId, userId) {
    try {
      const order = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          userId: userId,
          status: { in: ['OPEN', 'PARTIALLY_FILLED'] }
        }
      });

      if (!order) {
        throw new Error('Order not found or cannot be cancelled');
      }

      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });

      console.log(`✅ Order ${orderId} cancelled`);

    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      throw error;
    }
  }

  async getOrderBook(assetSymbol) {
    try {
      const asset = await this.prisma.asset.findUnique({
        where: { symbol: assetSymbol }
      });

      if (!asset) {
        throw new Error(`Asset ${assetSymbol} not found`);
      }

      const [buyOrders, sellOrders] = await Promise.all([
        this.prisma.order.findMany({
          where: {
            assetId: asset.id,
            type: 'BUY',
            status: { in: ['OPEN', 'PARTIALLY_FILLED'] }
          },
          orderBy: { price: 'desc' }
        }),
        this.prisma.order.findMany({
          where: {
            assetId: asset.id,
            type: 'SELL',
            status: { in: ['OPEN', 'PARTIALLY_FILLED'] }
          },
          orderBy: { price: 'asc' }
        })
      ]);

      return {
        buyOrders: buyOrders.map(order => ({
          price: ethers.formatEther(order.price),
          quantity: ethers.formatEther(order.remaining)
        })),
        sellOrders: sellOrders.map(order => ({
          price: ethers.formatEther(order.price),
          quantity: ethers.formatEther(order.remaining)
        }))
      };

    } catch (error) {
      console.error('❌ Error getting order book:', error);
      throw error;
    }
  }
}

// Singleton instance
const tradingService = new TradingService();

module.exports = tradingService;
