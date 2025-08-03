# 📋 API Reference - Financial Platform

## Base URL
```
http://localhost:3001/api
```

## Authentication
L'API utilise JWT (JSON Web Tokens) pour l'authentification. Incluez le token dans l'en-tête Authorization :
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Authentication Endpoints

### POST /auth/login
Connexion utilisateur avec adresse wallet
```json
POST /api/auth/login
Content-Type: application/json

{
  "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "legalName": "Aya",
    "kycStatus": "VERIFIED"
  }
}
```

### GET /auth/me
Obtenir le profil utilisateur actuel (nécessite authentification)
```json
GET /api/auth/me
Authorization: Bearer YOUR_TOKEN
```

**Response 200:**
```json
{
  "user": {
    "id": 1,
    "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "legalName": "Aya",
    "kycStatus": "VERIFIED",
    "createdAt": "2025-08-01T10:00:00.000Z"
  }
}
```

---

## 💹 Trading Endpoints

### POST /trading/order
Créer un nouvel ordre de trading
```json
POST /api/trading/order
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "pair": "CLV/TRG",
  "type": "BUY",
  "quantity": 5,
  "price": 50
}
```

**Response 201:**
```json
{
  "status": "OK",
  "message": "Order created successfully",
  "order": {
    "id": 123,
    "type": "BUY",
    "assetSymbol": "CLV",
    "price": 50,
    "quantity": 5,
    "remaining": 5,
    "status": "PENDING",
    "createdAt": "2025-08-03T14:30:00.000Z"
  }
}
```

### GET /trading/orders
Obtenir les ordres de l'utilisateur connecté
```json
GET /api/trading/orders
Authorization: Bearer YOUR_TOKEN
```

**Response 200:**
```json
{
  "status": "OK",
  "orders": [
    {
      "id": 123,
      "type": "BUY",
      "assetSymbol": "CLV",
      "price": 50,
      "quantity": 5,
      "remaining": 5,
      "status": "PENDING",
      "createdAt": "2025-08-03T14:30:00.000Z"
    }
  ]
}
```

### GET /trading/orderbook/:pair
Obtenir le carnet d'ordres pour une paire
```json
GET /api/trading/orderbook/CLV%2FTRG
Authorization: Bearer YOUR_TOKEN
```

**Response 200:**
```json
{
  "status": "OK",
  "pair": "CLV/TRG",
  "orderBook": {
    "buyOrders": [
      {
        "price": 49,
        "quantity": 10,
        "total": 490
      }
    ],
    "sellOrders": [
      {
        "price": 51,
        "quantity": 8,
        "total": 408
      }
    ]
  }
}
```

### DELETE /trading/order/:orderId
Annuler un ordre spécifique
```json
DELETE /api/trading/order/123
Authorization: Bearer YOUR_TOKEN
```

**Response 200:**
```json
{
  "status": "OK",
  "message": "Order cancelled successfully"
}
```

### GET /trading/trades
Obtenir l'historique des trades de l'utilisateur
```json
GET /api/trading/trades
Authorization: Bearer YOUR_TOKEN
```

**Response 200:**
```json
{
  "status": "OK",
  "trades": [
    {
      "id": 456,
      "assetSymbol": "CLV",
      "type": "BUY",
      "price": 50,
      "quantity": 3,
      "total": 150,
      "executedAt": "2025-08-03T14:35:00.000Z"
    }
  ]
}
```

### GET /trading/stats
Obtenir les statistiques de trading
```json
GET /api/trading/stats
Authorization: Bearer YOUR_TOKEN
```

**Response 200:**
```json
{
  "status": "OK",
  "stats": {
    "totalTrades": 15,
    "totalVolume": 2500,
    "winRate": 0.73,
    "avgTradeSize": 166.67
  }
}
```

---

## 💰 Portfolio Endpoints

### GET /portfolio/balances
Obtenir les balances du portfolio
```json
GET /api/portfolio/balances
Authorization: Bearer YOUR_TOKEN
```

**Response 200:**
```json
{
  "status": "OK",
  "balances": [
    {
      "assetSymbol": "TRG",
      "totalBalance": 300,
      "availableBalance": 250,
      "lockedBalance": 50,
      "platformBalance": 0
    },
    {
      "assetSymbol": "CLV",
      "totalBalance": 19,
      "availableBalance": 15,
      "lockedBalance": 4,
      "platformBalance": 19
    }
  ]
}
```

### GET /portfolio/summary
Obtenir un résumé du portfolio
```json
GET /api/portfolio/summary
Authorization: Bearer YOUR_TOKEN
```

**Response 200:**
```json
{
  "status": "OK",
  "summary": {
    "totalValue": 1200,
    "totalAssets": 3,
    "dayChange": 2.5,
    "weekChange": 8.7
  }
}
```

### GET /portfolio/performance
Obtenir les performances du portfolio
```json
GET /api/portfolio/performance
Authorization: Bearer YOUR_TOKEN
```

**Response 200:**
```json
{
  "status": "OK",
  "performance": {
    "totalReturn": 15.3,
    "dailyReturns": [1.2, -0.5, 2.1, 0.8],
    "sharpeRatio": 1.8,
    "maxDrawdown": -5.2
  }
}
```

---

## 📊 Assets Endpoints

### GET /assets/:symbol
Obtenir les informations détaillées d'un asset
```json
GET /api/assets/CLV
```

**Response 200:**
```json
{
  "status": "OK",
  "asset": {
    "symbol": "CLV",
    "name": "Clove Company",
    "type": "SHARE",
    "contractAddress": "0x4826533B4897376654Bb4d4AD88B7faFD0C98528",
    "decimals": 18,
    "totalSupply": 100,
    "currentPrice": 50,
    "marketCap": 5000,
    "volume24h": 120,
    "priceChange24h": 2.5
  }
}
```

---

## 📈 Public Trading Endpoints
**Note:** Ces endpoints sont publics et ne nécessitent pas d'authentification

### GET /public/trading/history/:symbol
Obtenir l'historique des prix publics
```json
GET /api/public/trading/history/CLV
```

**Response 200:**
```json
{
  "status": "OK",
  "symbol": "CLV",
  "history": [
    {
      "price": 50,
      "timestamp": "2025-08-03T14:30:00.000Z",
      "volume": 5
    },
    {
      "price": 48,
      "timestamp": "2025-08-03T13:15:00.000Z",
      "volume": 8
    }
  ]
}
```

### GET /public/trading/price/:symbol
Obtenir le prix actuel public
```json
GET /api/public/trading/price/CLV
```

**Response 200:**
```json
{
  "status": "OK",
  "symbol": "CLV",
  "price": 50,
  "timestamp": "2025-08-03T14:30:00.000Z",
  "source": "last_trade"
}
```

---

## 🏥 Health Endpoints

### GET /health
Vérifier l'état de l'API
```json
GET /health
```

**Response 200:**
```json
{
  "status": "OK",
  "message": "Financial Platform API is running",
  "timestamp": "2025-08-03T14:30:00.000Z",
  "version": "1.0.0",
  "services": {
    "web3Ready": true,
    "eventsReady": true,
    "tradingReady": true,
    "authentication": true,
    "uptime": 3600
  }
}
```

### GET /api/test-db
Tester la connexion à la base de données
```json
GET /api/test-db
```

**Response 200:**
```json
{
  "status": "OK",
  "message": "Database connection successful",
  "timestamp": "2025-08-03T14:30:00.000Z"
}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "required": ["pair", "type", "quantity", "price"]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Please provide a valid JWT token"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found",
  "message": "The requested asset or endpoint was not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 🔧 Rate Limiting
- **Limite globale** : 1000 requêtes/heure par IP
- **Limite trading** : 100 ordres/minute par utilisateur
- **Limite authentification** : 10 tentatives/minute par IP

## 📝 Notes Importantes
1. Tous les timestamps sont en format ISO 8601 UTC
2. Les prix sont exprimés en unités TRG (Triangle)
3. Les quantités sont en unités entières de l'asset
4. Les adresses Ethereum doivent être au format checksummed
5. Les paires de trading supportées : CLV/TRG, ROO/TRG, GOV/TRG

## 🧪 Environment de Test
- **Base URL** : `http://localhost:3001/api`
- **Comptes de test** disponibles avec clés privées connues
- **Reset de la DB** : Possible via les scripts de migration