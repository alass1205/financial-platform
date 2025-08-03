# 🚀 Guide de Déploiement Step-by-Step
## Financial Platform DeFi - Déploiement Complet

Ce guide vous accompagne dans le déploiement complet de la plateforme financière, étape par étape.

---

## 📋 **Prérequis**

### **Système Requis**
- **OS** : Ubuntu 20.04+ / macOS 12+ / Windows 10+ (avec WSL2)
- **RAM** : Minimum 8GB, Recommandé 16GB
- **Stockage** : 20GB disponible
- **Réseau** : Internet stable (pour téléchargements)

### **Logiciels Requis**
```bash
# Vérifier Node.js (version 18+)
node --version    # Doit afficher v18.x.x ou plus

# Vérifier npm
npm --version     # Doit afficher 9.x.x ou plus

# Installer si nécessaire
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### **PostgreSQL Installation**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Démarrer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### **Git Configuration**
```bash
git --version
# Si pas installé: sudo apt install git
```

---

## 🔧 **ÉTAPE 1 : Clone et Installation**

### **1.1 Cloner le Projet**
```bash
cd ~/
git clone [VOTRE_REPO_URL] financial-platform
cd financial-platform

# Vérifier la structure
ls -la
# Doit afficher: contracts/ backend/ frontend/ scripts/ docs/
```

### **1.2 Installation des Dépendances Racine**
```bash
# À la racine du projet
npm install

# Vérifier que Hardhat est installé
npx hardhat --version
```

### **1.3 Installation Backend**
```bash
cd backend
npm install

# Vérifier les dépendances critiques
npm list express prisma ethers
```

### **1.4 Installation Frontend**
```bash
cd ../frontend
npm install

# Vérifier les dépendances critiques
npm list react vite tailwindcss
```

---

## 🗄️ **ÉTAPE 2 : Configuration Base de Données**

### **2.1 Créer la Base de Données**
```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Dans le shell PostgreSQL
CREATE DATABASE financial_platform;
CREATE USER platform_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE financial_platform TO platform_user;
\q
```

### **2.2 Configuration Backend Environment**
```bash
cd backend

# Créer le fichier .env
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://platform_user:secure_password_123@localhost:5432/financial_platform"

# JWT Secret (générer un secret sécurisé)
JWT_SECRET="your_super_secure_jwt_secret_here_change_this"

# Blockchain
BLOCKCHAIN_RPC_URL="http://localhost:8545"
NETWORK_NAME="localhost"

# Ports
PORT=3001

# Adresses Contrats (seront mises à jour automatiquement)
TRG_ADDRESS=""
CLV_ADDRESS=""  
ROO_ADDRESS=""
GOV_ADDRESS=""
VAULT_ADDRESS=""
EOF
```

### **2.3 Initialiser Prisma**
```bash
# Toujours dans backend/
npx prisma generate
npx prisma db push

# Vérifier la connexion DB
npm run test-db
# Doit afficher "Database connection successful"
```

---

## ⛓️ **ÉTAPE 3 : Déploiement Blockchain**

### **3.1 Démarrer la Blockchain Locale**
```bash
# Nouveau terminal - à la racine du projet
cd ~/financial-platform
npx hardhat node

# Laisser tourner - doit afficher:
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
# 
# Accounts
# ========
# Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
# Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# ...
```

### **3.2 Déployer les Smart Contracts**
```bash
# Nouveau terminal - à la racine
cd ~/financial-platform

# Compiler les contrats
npx hardhat compile

# Déployer tous les contrats avec population
npx hardhat run scripts/deploy-complete-platform.js --network localhost

# Doit afficher:
# 🚀 DÉPLOIEMENT COMPLET DE LA PLATEFORME FINANCIÈRE + VAULT
# ✅ TRG déployé: 0x...
# ✅ CLV déployé: 0x...
# ✅ ROO déployé: 0x...
# ✅ GOV déployé: 0x...
# ✅ VAULT déployé: 0x...
# 🎉 PLATEFORME FINANCIÈRE + VAULT DÉPLOYÉE AVEC SUCCÈS !
```

### **3.3 Vérifier le Déploiement**
```bash
# Vérifier que le fichier de déploiement est créé
cat complete-platform-deployment.json

# Doit contenir toutes les adresses des contrats
```

---

## 🔄 **ÉTAPE 4 : Synchronisation Backend**

### **4.1 Mettre à Jour les Adresses Contrats**
```bash
cd backend

# Exécuter le script de synchronisation
node update-vault-contracts.js

# Doit afficher:
# 🔄 Mise à jour des contrats dans la DB...
# ✅ TRG mis à jour: 0x...
# ✅ CLV mis à jour: 0x...
# ✅ ROO mis à jour: 0x...
# ✅ GOV mis à jour: 0x...
# 🏦 Vault Address: 0x...
# 🎉 Mise à jour terminée !
```

### **4.2 Peupler la Base de Données**
```bash
# Toujours dans backend/
node seed-assets.js

# Créer les balances initiales
node create-balances.js

# Vérifier les données
npx prisma studio
# Ouvre http://localhost:5555 - vérifier tables Asset, User, Balance
```

---

## 🖥️ **ÉTAPE 5 : Démarrage des Services**

### **5.1 Démarrer le Backend API**
```bash
# Terminal backend
cd ~/financial-platform/backend
npm run dev

# Doit afficher:
# 🚀 Starting Financial Platform API...
# ✅ Web3 service ready
# ✅ Event listeners ready  
# ✅ Trading service ready
# 🚀 Server running on port 3001
```

### **5.2 Tester l'API Backend**
```bash
# Nouveau terminal - tester les endpoints
curl http://localhost:3001/health

# Doit retourner:
# {"status":"OK","message":"Financial Platform API is running",...}

curl http://localhost:3001/api/test-db
# Doit retourner: {"status":"OK","message":"Database connection successful"}
```

### **5.3 Démarrer le Frontend**
```bash
# Nouveau terminal
cd ~/financial-platform/frontend
npm run dev

# Doit afficher:
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

---

## ✅ **ÉTAPE 6 : Vérification Complète**

### **6.1 Tester l'Interface Web**
1. **Ouvrir** http://localhost:5173
2. **Page d'accueil** doit s'afficher correctement
3. **Cliquer "Assets"** → Voir CLV, ROO, GOV
4. **Page CLV** → Graphique + contrôles trading visibles
5. **Page Portfolio** → Interface de portfolio
6. **Page FAQ** → Documentation utilisateur

### **6.2 Vérifier les Données Réelles**
```bash
# Tester les endpoints publics
curl http://localhost:3001/api/public/trading/price/CLV
# Doit retourner le prix actuel de CLV

curl http://localhost:3001/api/public/trading/history/CLV  
# Doit retourner l'historique des prix
```

### **6.3 Test de Trading**
1. **Connecter MetaMask** avec une clé privée de test
2. **Login** sur la plateforme
3. **Aller sur page CLV**
4. **Créer un ordre** de test
5. **Vérifier** dans Portfolio

---

## 🔧 **ÉTAPE 7 : Configuration Avancée**

### **7.1 Variables d'Environnement Frontend**
```bash
cd frontend

# Créer .env.local si nécessaire
cat > .env.local << 'EOF'
VITE_API_BASE_URL=http://localhost:3001/api
VITE_BLOCKCHAIN_RPC_URL=http://localhost:8545
EOF
```

### **7.2 Configuration SSL (Production)**
```bash
# Pour production - configurer nginx
sudo apt install nginx certbot python3-certbot-nginx

# Configuration nginx (exemple)
sudo nano /etc/nginx/sites-available/financial-platform
```

### **7.3 Monitoring et Logs**
```bash
# Configurer PM2 pour production
npm install -g pm2

# Backend en production
cd backend
pm2 start src/server.js --name "financial-api"

# Frontend build
cd ../frontend  
npm run build
pm2 serve dist 5173 --name "financial-frontend"
```

---

## 🚨 **Résolution de Problèmes**

### **Problème : Blockchain ne démarre pas**
```bash
# Nettoyer le cache Hardhat
npx hardhat clean
rm -rf cache artifacts

# Redémarrer
npx hardhat node
```

### **Problème : Backend ne se connecte pas à la DB**
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Tester la connexion
psql -h localhost -U platform_user -d financial_platform

# Reset Prisma si nécessaire
cd backend
npx prisma db push --force-reset
```

### **Problème : Frontend ne charge pas**
```bash
# Clear cache
cd frontend
rm -rf node_modules dist .vite
npm install
npm run dev
```

### **Problème : Contrats pas déployés**
```bash
# Vérifier que la blockchain tourne
curl http://localhost:8545

# Re-déployer
npx hardhat run scripts/deploy-complete-platform.js --network localhost
```

---

## ✅ **Checklist de Déploiement Final**

- [ ] ✅ Node.js 18+ installé et fonctionnel
- [ ] ✅ PostgreSQL installé et démarré  
- [ ] ✅ Base de données créée et configurée
- [ ] ✅ Blockchain locale démarrée (port 8545)
- [ ] ✅ Smart contracts déployés avec succès
- [ ] ✅ Backend API démarré (port 3001)
- [ ] ✅ Frontend démarré (port 5173)
- [ ] ✅ Pages assets accessibles et fonctionnelles
- [ ] ✅ Graphiques de prix affichent des données
- [ ] ✅ Endpoints API répondent correctement
- [ ] ✅ Tests de connexion DB réussis
- [ ] ✅ Documentation accessible

---

## 🎯 **URLs de Vérification**

Une fois le déploiement terminé, ces URLs doivent être accessibles :

| Service | URL | Status Attendu |
|---------|-----|----------------|
| **Frontend** | http://localhost:5173 | Interface complète |
| **API Health** | http://localhost:3001/health | `{"status":"OK"}` |
| **API DB Test** | http://localhost:3001/api/test-db | `{"status":"OK"}` |
| **Prix CLV** | http://localhost:3001/api/public/trading/price/CLV | Prix actuel |
| **Page CLV** | http://localhost:5173/asset/CLV | Graphique + trading |
| **Portfolio** | http://localhost:5173/portfolio | Balances utilisateur |
| **FAQ** | http://localhost:5173/faq | Documentation |

---

## 🏆 **Félicitations !**

Si toutes les étapes sont complétées avec succès, votre plateforme DeFi est maintenant **entièrement déployée et opérationnelle** ! 

**Prochaines étapes recommandées :**
1. Tester le trading avec les comptes de test
2. Explorer la documentation API complète
3. Configurer un réseau multi-nœuds (Jour 15-16)
4. Implémenter le système de dividendes (Jour 17)

---

**⚠️ Note Importante :** Ce guide couvre le déploiement en environnement de développement local. Pour un déploiement en production, des considérations de sécurité et de performance supplémentaires sont nécessaires.