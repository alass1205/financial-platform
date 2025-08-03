# 🏦 Financial Platform DeFi
## Plateforme de Trading d'Instruments Financiers sur Blockchain

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/votre-repo/financial-platform)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![Hardhat](https://img.shields.io/badge/hardhat-2.19+-yellow.svg)](https://hardhat.org/)
[![React](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)

---

## 📋 **Vue d'ensemble**

Cette plateforme DeFi permet le trading d'instruments financiers tokenisés sur une blockchain privée. Elle comprend :

- **🪙 Stablecoin TRG** (Triangle) - 4000 unités disponibles
- **📈 Actions CLV** (Clove Company) - 100 actions avec dividendes
- **📈 Actions ROO** (Rooibos Limited) - 100 actions avec dividendes  
- **🏛️ Obligations GOV** (Government Bonds) - 20 NFT à 200 TRG, 10% intérêt

### 🏗️ **Architecture**

- **Smart Contracts** : Solidity + OpenZeppelin
- **Backend API** : Node.js + Express + PostgreSQL + Prisma
- **Frontend** : React + Vite + TailwindCSS + Recharts
- **Blockchain** : Réseau privé Ethereum (Hardhat)
- **Custody** : Vault multi-signature pour sécuriser les assets

---

## 🚀 **Démarrage Rapide**

### **Prérequis**
```bash
# Node.js 18+ et npm requis
node --version  # v18+
npm --version   # 9+
```

### **Installation**
```bash
git clone [votre-repo]
cd financial-platform
npm install
```

### **Déploiement Complet**
```bash
# 1. Démarrer la blockchain locale
npx hardhat node

# 2. Déployer tous les contrats (nouveau terminal)
npx hardhat run scripts/deploy-complete-platform.js --network localhost

# 3. Démarrer le backend API (nouveau terminal)
cd backend
npm install
npm run dev

# 4. Démarrer le frontend (nouveau terminal)
cd frontend
npm install
npm run dev
```

### **Accès à la Plateforme**
- **Frontend** : http://localhost:5173
- **API Backend** : http://localhost:3001
- **Blockchain RPC** : http://localhost:8545

---

## 📚 **Documentation Complète**

| Section | Description | Lien |
|---------|-------------|------|
| 🔧 **Déploiement** | Guide step-by-step complet | [docs/deployment/](docs/deployment/) |
| 🏗️ **Architecture** | Schémas et structure du projet | [docs/architecture/](docs/architecture/) |
| 🔌 **API Reference** | Documentation des endpoints | [docs/api/](docs/api/) |
| 📱 **Guide Utilisateur** | Comment utiliser la plateforme | [docs/user-guide/](docs/user-guide/) |
| 🔒 **Smart Contracts** | Documentation détaillée des contrats | [docs/contracts/](docs/contracts/) |

---

## ⚡ **Fonctionnalités Principales**

### **🏠 Interface Web**
- **Page d'accueil** : Connexion wallet et présentation
- **Pages Assets** : CLV, ROO, GOV avec graphiques prix et trading
- **Portfolio** : Visualisation balances et gestion retraits
- **FAQ** : Guide d'utilisation complet

### **💹 Trading Engine**
- **Matching FIFO** : Exécution optimale des ordres
- **Order Books** : Buy/Sell orders avec prix limités
- **Market Orders** : Achat/Vente au prix du marché
- **Partial Fill** : Support des exécutions partielles

### **🏦 Système de Custody**
- **Vault Contract** : Multi-signature sécurisé
- **Dépôts/Retraits** : Monitoring blockchain automatique
- **KYC** : Upload documents d'identité
- **Authentication** : JWT + wallet signatures

---

## 🧪 **Comptes de Test**

| Utilisateur | Adresse | TRG | CLV | ROO | GOV |
|-------------|---------|-----|-----|-----|-----|
| **Aya** | `0x70997970...` | 200 | 10 | 0 | 2 |
| **Beatriz** | `0x3C44CdDd...` | 150 | 0 | 20 | 5 |

### **Clés Privées de Test**
```bash
# Aya
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# Beatriz  
0x5de4111afa82c9c7b7b7e2c012c87a927c7b9b42f13566b3f1e3b3f1e3b3f1e3
```

---

## 📊 **Données par Défaut**

### **Prix Initiaux**
- **CLV** : 10 TRG
- **ROO** : 10 TRG  
- **GOV** : 200 TRG

### **Prix Actuels** (avec trades réels)
- **CLV** : ~50 TRG (4 trades exécutés)
- **ROO** : ~50 TRG
- **GOV** : 200 TRG

---

## 🛠️ **Scripts Utiles**

```bash
# Blockchain
npx hardhat node              # Démarrer blockchain locale
npx hardhat run scripts/deploy-complete-platform.js --network localhost

# Backend
cd backend
npm install
npm run dev                   # Mode développement
npm run start                 # Mode production
npm run db:migrate            # Migrations Prisma
npm run db:seed               # Peupler la DB

# Frontend  
cd frontend
npm install
npm run dev                   # Serveur développement
npm run build                 # Build production
npm run preview               # Prévisualisez build

# Tests
npm test                      # Tests Hardhat
```

---

## 🔧 **Configuration Avancée**

### **Variables d'Environnement**
```bash
# Backend/.env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
BLOCKCHAIN_RPC_URL="http://localhost:8545"
VAULT_ADDRESS="0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf"

# Adresses des Contrats (auto-générées)
TRG_ADDRESS="0x70e0bA845a1A0F2DA3359C97E0285013525FFC49"
CLV_ADDRESS="0x4826533B4897376654Bb4d4AD88B7faFD0C98528"
ROO_ADDRESS="0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf"
GOV_ADDRESS="0x0E801D84Fa97b50751Dbf25036d067dCf18858bF"
```

### **Ports par Défaut**
- **Frontend** : 5173
- **Backend API** : 3001
- **Blockchain RPC** : 8545
- **PostgreSQL** : 5432

---

## 🚨 **Résolution de Problèmes**

### **Blockchain Issues**
```bash
# Reset de la blockchain locale
npx hardhat clean
rm -rf cache artifacts
npx hardhat node

# Re-déployer les contrats
npx hardhat run scripts/deploy-complete-platform.js --network localhost
```

### **Backend Issues**
```bash
# Vérifier la connexion DB
cd backend && npm run db:status

# Reset des migrations
npm run db:reset && npm run db:migrate
```

### **Frontend Issues**
```bash
# Clear cache et rebuild
cd frontend
rm -rf node_modules dist
npm install && npm run build
```

---

## 📈 **Roadmap**

### **✅ Complété (Jour 12)**
- [x] Smart contracts (TRG, CLV, ROO, GOV, Vault)
- [x] Backend API complet avec trading engine
- [x] Frontend React avec pages assets
- [x] Système d'authentification et KYC
- [x] Graphiques prix avec données réelles
- [x] Dépôts/retraits via Vault contract

### **🔄 En Cours (Jour 13)**
- [x] Documentation développeur complète
- [ ] Documentation API détaillée
- [ ] Guide déploiement step-by-step
- [ ] Architecture détaillée avec schémas

### **📋 À Venir**
- [ ] Réseau multi-nœuds (3+ validateurs)
- [ ] Système de dividendes pour actions
- [ ] Interface trading avancée
- [ ] Analytics et monitoring

---

## 🤝 **Contribution**

Cette plateforme a été développée dans le cadre d'un projet académique sur les technologies blockchain et DeFi.

### **Structure du Projet**
```
financial-platform/
├── contracts/          # Smart contracts Solidity
├── backend/            # API Node.js + PostgreSQL  
├── frontend/           # React application
├── scripts/            # Scripts de déploiement
├── docs/              # Documentation complète
└── tests/             # Tests automatisés
```

---

## 📝 **Licence**

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

---

## 📞 **Support**

- **Documentation** : [docs/](docs/)
- **FAQ** : [docs/user-guide/faq.md](docs/user-guide/faq.md)

---

**🎯 Développé avec ❤️ pour l'écosystème DeFi**