# 🏗️ Architecture du Projet
## Financial Platform DeFi - Structure et Design

Cette documentation détaille l'architecture complète de la plateforme financière décentralisée.

---

## 📊 **Vue d'Ensemble de l'Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    FINANCIAL PLATFORM DEFI                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    │
│  │   FRONTEND  │◄──►│   BACKEND    │◄──►│ BLOCKCHAIN  │    │
│  │   React     │    │   Node.js    │    │  Ethereum   │    │
│  │   Port 5173 │    │   Port 3001  │    │  Port 8545  │    │
│  └─────────────┘    └──────────────┘    └─────────────┘    │
│                              │                              │
│                    ┌──────────────┐                        │
│                    │  DATABASE    │                        │
│                    │ PostgreSQL   │                        │
│                    │  Port 5432   │                        │
│                    └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ **Architecture en Couches**

### **Couche 1: Interface Utilisateur (Frontend)**
- **Framework** : React 18 + Vite
- **Styling** : TailwindCSS
- **Graphiques** : Recharts
- **Wallet Integration** : ethers.js
- **State Management** : React Context + Hooks

### **Couche 2: Logique Métier (Backend)**
- **Runtime** : Node.js 18+
- **Framework** : Express.js
- **ORM** : Prisma
- **Authentication** : JWT
- **Web3** : ethers.js

### **Couche 3: Données (Database)**
- **SGBD** : PostgreSQL
- **Schema** : Géré par Prisma
- **Migrations** : Automatiques

### **Couche 4: Blockchain (Smart Contracts)**
- **Réseau** : Ethereum privé (Hardhat)
- **Langage** : Solidity 0.8.19
- **Framework** : OpenZeppelin
- **Custody** : Vault multi-signature

---

## 📁 **Structure des Dossiers**

```
financial-platform/
├── 📁 contracts/                   # Smart Contracts Solidity
│   ├── BondToken.sol              # Obligations GOV (ERC721)
│   ├── ShareToken.sol             # Actions CLV/ROO (ERC20)
│   ├── TriangleCoin.sol           # Stablecoin TRG (ERC20)
│   └── Vault.sol                  # Custody contract
│
├── 📁 backend/                     # API Node.js
│   ├── 📁 src/
│   │   ├── 📁 routes/             # Endpoints API
│   │   │   ├── authRoutes.js      # Authentication
│   │   │   ├── tradingRoutes.js   # Trading orders
│   │   │   ├── portfolioRoutes.js # Portfolio management
│   │   │   ├── assets.js          # Asset information
│   │   │   └── public-trading.js  # Public endpoints
│   │   │
│   │   ├── 📁 services/           # Business Logic
│   │   │   ├── web3Service.js     # Blockchain interaction
│   │   │   ├── tradingService.js  # Trading engine FIFO
│   │   │   ├── eventService.js    # Blockchain events
│   │   │   └── portfolioService.js# Portfolio calculations
│   │   │
│   │   ├── 📁 middleware/         # Express middleware
│   │   │   ├── auth.js            # JWT verification
│   │   │   └── validation.js      # Input validation
│   │   │
│   │   └── server.js              # Main server file
│   │
│   ├── 📁 prisma/                 # Database schema
│   │   └── schema.prisma          # Data model
│   │
│   └── 📁 uploads/                # KYC documents
│
├── 📁 frontend/                    # React Application
│   ├── 📁 src/
│   │   ├── 📁 components/         # React components
│   │   │   ├── 📁 ui/             # UI components
│   │   │   ├── AssetCard.jsx      # Asset display
│   │   │   ├── TradingPanel.jsx   # Trading controls
│   │   │   └── PriceChart.jsx     # Price visualization
│   │   │
│   │   ├── 📁 pages/              # Page components
│   │   │   ├── HomePage.jsx       # Landing page
│   │   │   ├── AssetPage.jsx      # Individual assets
│   │   │   ├── PortfolioPage.jsx  # User portfolio
│   │   │   └── FAQPage.jsx        # Documentation
│   │   │
│   │   ├── 📁 services/           # API communication
│   │   │   ├── apiService.js      # HTTP client
│   │   │   └── tokenService.js    # Blockchain interaction
│   │   │
│   │   ├── 📁 context/            # React Context
│   │   │   └── WalletContext.jsx  # Wallet state
│   │   │
│   │   └── 📁 hooks/              # Custom hooks
│   │       ├── useTrading.js      # Trading logic
│   │       └── usePortfolio.js    # Portfolio logic
│   │
│   └── 📁 public/                 # Static assets
│
├── 📁 scripts/                     # Deployment scripts
│   ├── deploy-complete-platform.js# Full deployment
│   └── populate-platform.js       # Data seeding
│
├── 📁 docs/                        # Documentation complète
│   ├── 📁 api/                    # API reference
│   ├── 📁 architecture/           # Architecture docs
│   ├── 📁 deployment/             # Deployment guide
│   ├── 📁 user-guide/             # User documentation
│   └── 📁 contracts/              # Smart contracts docs
│
└── 📁 tests/                       # Tests automatisés
    ├── contract-tests/            # Smart contract tests
    ├── api-tests/                 # Backend API tests
    └── e2e-tests/                 # End-to-end tests
```

---

## 🔗 **Flux de Données**

### **1. Flux d'Authentification**
```
User Wallet → Frontend → Backend API → JWT Token → Database
     ↓            ↓           ↓            ↓           ↓
   Connect    Login Req   Verify Addr   Generate    Store User
```

### **2. Flux de Trading**
```
User Order → Frontend → Backend API → Trading Engine → Database
     ↓          ↓           ↓              ↓             ↓
   Submit   HTTP POST   Order Validation  FIFO Match   Persist

Blockchain Event ← Smart Contract ← Vault Operation ← Match Found
       ↓               ↓                ↓               ↓
   Event Listen    Execute Trade    Transfer Assets   Update DB
```

### **3. Flux de Données Prix**
```
Trading Engine → Database → API Endpoint → Frontend → Chart Display
      ↓             ↓           ↓            ↓            ↓
   Execute      Store Price  Public GET   HTTP Req    Recharts
```

---

## 🎯 **Composants Principaux**

### **Smart Contracts Layer**

#### **TriangleCoin (TRG)**
```solidity
contract TriangleCoin is ERC20, Ownable {
    // Stablecoin principal - 4000 unités
    // Fonctions: mint(), burn(), transfer()
}
```

#### **ShareToken (CLV/ROO)**
```solidity
contract ShareToken is ERC20, Ownable {
    // Actions avec dividendes
    // Fonctions: payDividend(), claimDividend()
}
```

#### **BondToken (GOV)**
```solidity
contract BondToken is ERC721, Ownable {
    // Obligations NFT - 20 unités
    // Principal: 200 TRG, Intérêt: 10%
}
```

#### **Vault Contract**
```solidity
contract Vault is Ownable, ReentrancyGuard {
    // Custody sécurisé multi-signature
    // Fonction critique: operateWithdrawal()
}
```

### **Backend Services Layer**

#### **Trading Engine**
```javascript
class TradingService {
  // FIFO matching algorithm
  async createOrder(userId, orderData)
  async matchOrders(assetSymbol)
  async executeTrading(buyOrder, sellOrder)
}
```

#### **Web3 Service**
```javascript
class Web3Service {
  // Blockchain interaction
  async initialize()
  async getContractInstance(address, abi)
  async monitorEvents()
}
```

#### **Portfolio Service**
```javascript
class PortfolioService {
  // Portfolio calculations
  async calculateBalances(userId)
  async getPerformanceMetrics(userId)
}
```

### **Frontend Components Layer**

#### **Asset Pages**
```jsx
function AssetPage({ symbol }) {
  // Graphique prix (gauche) + Trading controls (droite)
  return (
    <div className="grid grid-cols-2">
      <PriceChart symbol={symbol} />
      <TradingPanel symbol={symbol} />
    </div>
  )
}
```

#### **Trading Panel**
```jsx
function TradingPanel({ symbol }) {
  // Buy/Sell orders + Market orders
  const { createOrder } = useTrading()
  // UI pour création d'ordres
}
```

---

## 🗄️ **Modèle de Données**

### **Schema Prisma**
```prisma
model User {
  id          Int       @id @default(autoincrement())
  address     String    @unique
  legalName   String?
  kycStatus   KycStatus @default(PENDING)
  
  orders      Order[]
  balances    Balance[]
  trades      Trade[]
}

model Asset {
  symbol          String @id
  name            String
  type            AssetType
  contractAddress String
  decimals        Int @default(18)
  
  orders          Order[]
  trades          Trade[]
  balances        Balance[]
  priceHistory    PriceHistory[]
}

model Order {
  id          Int       @id @default(autoincrement())
  userId      Int
  assetSymbol String
  type        OrderType
  price       Decimal
  quantity    Decimal
  remaining   Decimal
  status      OrderStatus
  createdAt   DateTime @default(now())
  
  user        User   @relation(fields: [userId], references: [id])
  asset       Asset  @relation(fields: [assetSymbol], references: [symbol])
}

model Trade {
  id          Int      @id @default(autoincrement())
  buyOrderId  Int
  sellOrderId Int
  assetSymbol String
  price       Decimal
  quantity    Decimal
  executedAt  DateTime @default(now())
  
  asset       Asset @relation(fields: [assetSymbol], references: [symbol])
}
```

---

## ⚡ **Patterns Architecturaux**

### **1. MVC Pattern (Backend)**
- **Model** : Prisma schemas + Database
- **View** : JSON API responses
- **Controller** : Express route handlers

### **2. Component Pattern (Frontend)**
- **Smart Components** : Pages avec business logic
- **Dumb Components** : UI components réutilisables
- **Context Providers** : Global state management

### **3. Service Pattern**
- **Web3Service** : Abstraction blockchain
- **TradingService** : Logic métier trading
- **ApiService** : Abstraction HTTP client

### **4. Event-Driven Architecture**
```javascript
// Backend event listeners
eventService.on('Deposit', async (event) => {
  await portfolioService.updateBalance(event.user, event.asset, event.amount)
})

eventService.on('Trade', async (event) => {
  await tradingService.updateOrderBook(event.asset)
})
```

---

## 🔒 **Sécurité et Authentification**

### **JWT Authentication Flow**
```
1. User connects wallet (MetaMask)
2. Frontend requests login with wallet address
3. Backend generates JWT token
4. Token stored in localStorage
5. All API requests include Authorization header
6. Backend validates JWT on protected routes
```

### **Smart Contract Security**
- **OpenZeppelin** : Contracts audités et sécurisés
- **ReentrancyGuard** : Protection contre les attaques de réentrance
- **Ownable** : Contrôle d'accès par propriétaire
- **Multi-signature** : Vault contract sécurisé

### **API Security**
- **CORS** : Configuration restrictive
- **Rate Limiting** : Protection contre le spam
- **Input Validation** : Middleware de validation
- **SQL Injection** : Protection via Prisma ORM

---

## 📈 **Performance et Scalabilité**

### **Database Optimization**
```sql
-- Index sur les colonnes fréquemment requêtées
CREATE INDEX idx_orders_user_asset ON "Order"(userId, assetSymbol);
CREATE INDEX idx_trades_asset_time ON "Trade"(assetSymbol, executedAt);
CREATE INDEX idx_price_history ON "PriceHistory"(assetSymbol, timestamp);
```

### **API Caching**
```javascript
// Cache des prix pour réduire les requêtes DB
const priceCache = new Map()
const CACHE_TTL = 30000 // 30 secondes

async function getCachedPrice(symbol) {
  const cached = priceCache.get(symbol)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price
  }
  // Fetch from database...
}
```

### **Frontend Optimization**
- **Code Splitting** : Lazy loading des pages
- **Memoization** : React.memo sur les composants
- **Virtual Scrolling** : Pour les grandes listes
- **Bundle Optimization** : Vite configuration

---

## 🔄 **Intégrations et APIs**

### **Blockchain Integration**
```javascript
// ethers.js provider configuration
const provider = new ethers.JsonRpcProvider('http://localhost:8545')
const contracts = {
  TRG: new ethers.Contract(TRG_ADDRESS, TRG_ABI, provider),
  VAULT: new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider)
}
```

### **External APIs**
- **Aucune dépendance externe** par design
- **Prix générés** par le trading engine interne
- **Données self-contained** dans la database

---

## 🧪 **Testing Strategy**

### **Smart Contract Tests**
```javascript
// Hardhat tests avec Mocha/Chai
describe('TradingEngine', () => {
  it('should execute FIFO matching correctly')
  it('should handle partial fills')
  it('should update order book after trades')
})
```

### **API Tests**
```javascript
// Jest + Supertest
describe('POST /api/trading/order', () => {
  it('should create valid order')
  it('should reject invalid input')
  it('should require authentication')
})
```

### **Frontend Tests**
```javascript
// React Testing Library
describe('TradingPanel', () => {
  it('should render buy/sell controls')
  it('should submit valid orders')
  it('should display error messages')
})
```

---

## 📊 **Monitoring et Observabilité**

### **Health Checks**
- **GET /health** : Status global de l'API
- **GET /api/test-db** : Connexion database
- **Blockchain connectivity** : Auto-check Web3 service

### **Logging Strategy**
```javascript
// Structured logging
console.log('🚀 Server running on port', PORT)
console.log('✅ Web3 service ready')
console.log('❌ Database connection failed:', error)
```

### **Error Handling**
```javascript
// Global error handler
app.use((error, req, res, next) => {
  console.error('API Error:', error)
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  })
})
```

---

## 🔮 **Évolutions Futures**

### **Court Terme (Jours 14-17)**
1. **Réseau multi-nœuds** : 3+ validateurs
2. **Système dividendes** : CLV/ROO dividend distribution
3. **Trading avancé** : Limit orders, stop-loss
4. **UX améliorée** : Real-time updates

### **Moyen Terme**
1. **Mobile app** : React Native
2. **Advanced analytics** : Trading metrics
3. **Notifications** : WebSocket real-time
4. **API rate limiting** : Redis implementation

### **Long Terme**
1. **Mainnet deployment** : Ethereum/Polygon
2. **Decentralized governance** : DAO voting
3. **Cross-chain** : Bridge vers autres réseaux
4. **Advanced DeFi** : Liquidity pools, yield farming

---

## 📋 **Points Clés de l'Architecture**

### **✅ Forces**
- **Modulaire** : Components bien séparés
- **Scalable** : Architecture prête pour la croissance
- **Sécurisé** : Multiple layers de sécurité
- **Testable** : Code facilement testable
- **Maintenable** : Code propre et documenté

### **⚠️ Considérations**
- **Single point of failure** : Backend centralisé
- **Database bottleneck** : PostgreSQL limite de performance
- **Gas costs** : Optimisation des smart contracts nécessaire
- **User experience** : MetaMask dependency

### **🎯 Design Principles**
1. **Separation of Concerns** : Chaque layer a sa responsabilité
2. **DRY (Don't Repeat Yourself)** : Code réutilisable
3. **SOLID Principles** : Architecture robuste
4. **Security First** : Sécurité intégrée par design
5. **User-Centric** : UX prioritaire dans les décisions

---

Cette architecture fournit une base solide pour une plateforme DeFi complète, évolutive et sécurisée.