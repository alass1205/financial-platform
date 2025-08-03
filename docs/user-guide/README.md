# 📱 Guide Utilisateur - Financial Platform DeFi
## Comment utiliser la plateforme de trading d'instruments financiers

Ce guide vous accompagne dans l'utilisation complète de la plateforme DeFi pour trader des actions, obligations et stablecoins.

---

## 🚀 **Premiers Pas**

### **1. Prérequis**
- **Navigateur compatible** : Chrome, Firefox, Safari, Edge
- **Wallet Ethereum** : MetaMask installé et configuré
- **Réseau** : Connexion à la blockchain locale (localhost:8545)

### **2. Configuration MetaMask**
```
Nom du réseau : Localhost 8545
URL RPC : http://localhost:8545
Chain ID : 31337
Symbole : ETH
```

### **3. Comptes de Test Disponibles**
| Utilisateur | Adresse | Clé Privée | TRG | CLV | ROO | GOV |
|-------------|---------|------------|-----|-----|-----|-----|
| **Aya** | `0x70997970...` | `0x59c6995e...` | 200 | 10 | 0 | 2 |
| **Beatriz** | `0x3C44CdDd...` | `0x5de4111a...` | 150 | 0 | 20 | 5 |

---

## 🏠 **Page d'Accueil**

### **Interface Principale**
La page d'accueil présente :
- **Présentation** de la plateforme DeFi
- **Bouton "Connect Wallet"** pour se connecter
- **Navigation** vers les différentes sections
- **Statistiques** globales de la plateforme

### **Se Connecter**
1. **Cliquer** sur "Connect Wallet"
2. **Autoriser** MetaMask à se connecter
3. **Confirmer** la connexion dans MetaMask
4. **Vérifier** que votre adresse s'affiche en haut à droite

### **Navigation**
- **Home** : Page d'accueil
- **Assets** : Dropdown avec CLV, ROO, GOV
- **Portfolio** : Vos balances et positions
- **FAQ** : Documentation et aide

---

## 📊 **Pages Assets**

### **Page CLV (Clove Company)**
**URL** : `/asset/CLV`

#### **Section Gauche - Graphique Prix**
- **Graphique linéaire** avec l'évolution du prix CLV
- **Prix actuel** affiché en temps réel
- **Historique** des trades précédents
- **Volume** de trading quotidien

#### **Section Droite - Contrôles Trading**
- **Prix actuel** : ~50 TRG (mis à jour en temps réel)
- **Boutons Market** :
  - "Buy at Market" : Acheter au prix du marché
  - "Sell at Market" : Vendre au prix du marché
- **Formulaires Limit Orders** :
  - Quantité désirée
  - Prix limite
  - Boutons "Place Buy Order" / "Place Sell Order"

#### **Comment Trader CLV**
1. **Se connecter** avec MetaMask
2. **Aller** sur `/asset/CLV`
3. **Choisir** entre Market Order ou Limit Order :
   
   **Market Order :**
   - Saisir la quantité (ex: 5 CLV)
   - Cliquer "Buy at Market" ou "Sell at Market"
   - Confirmer dans MetaMask
   
   **Limit Order :**
   - Saisir quantité (ex: 3 CLV)
   - Saisir prix limite (ex: 45 TRG)
   - Cliquer "Place Buy Order"
   - L'ordre sera exécuté quand le prix atteint 45 TRG

### **Page ROO (Rooibos Limited)**
**URL** : `/asset/ROO`

Fonctionnalités identiques à CLV :
- **Prix actuel** : ~50 TRG
- **Graphique** d'évolution des prix
- **Trading controls** : Buy/Sell Market et Limit
- **Historique** des transactions

### **Page GOV (Government Bonds)**
**URL** : `/asset/GOV`

#### **Spécificités des Obligations**
- **Prix fixe** : 200 TRG par obligation
- **Type** : NFT (Non-Fungible Token)
- **Intérêt** : 10% annuel
- **Maturité** : 1 an
- **Quantité limitée** : 20 obligations total

#### **Trading des Obligations**
- **Achat** : Toujours à 200 TRG
- **Vente** : Prix négocié entre utilisateurs
- **Unique** : Chaque obligation a un ID unique
- **Dividendes** : 10% d'intérêt à maturité

---

## 💼 **Page Portfolio**

### **Vue d'Ensemble**
**URL** : `/portfolio`

#### **Tableau des Balances**
| Asset | On Platform | Total Available | Actions |
|-------|-------------|----------------|---------|
| TRG   | 0           | 300            | -       |
| CLV   | 19          | 19             | ⬇️ Withdraw |
| ROO   | 0           | 0              | -       |
| GOV   | 0           | 5              | ⬇️ Withdraw |

#### **Colonnes Expliquées**
- **On Platform** : Assets stockés dans le Vault contract
- **Total Available** : Assets totaux dans votre wallet
- **Bouton Withdraw** : Retirer des assets du Vault vers votre wallet

#### **Graphique Portfolio**
- **Pie chart** montrant la répartition de vos assets
- **Valeur totale** en TRG
- **Pourcentages** par asset
- **Évolution** de la valeur du portfolio

### **Comment Retirer des Assets**
1. **Aller** sur la page Portfolio
2. **Identifier** l'asset avec balance "On Platform" > 0
3. **Cliquer** sur le bouton ⬇️ Withdraw
4. **Confirmer** le retrait
5. **Vérifier** que les assets arrivent dans votre wallet MetaMask

---

## ❓ **Page FAQ**

### **Questions Fréquentes**

#### **Comment déposer des assets sur la plateforme ?**
Les dépôts se font automatiquement lors du trading. Quand vous placez un ordre de vente, vos assets sont transférés vers le Vault contract de la plateforme.

#### **Comment fonctionne le matching des ordres ?**
La plateforme utilise un algorithme FIFO (First In, First Out) :
1. Les ordres d'achat et de vente sont stockés dans des order books
2. Quand un nouvel ordre arrive, il est matché avec le meilleur ordre opposé
3. Si aucun match, l'ordre reste en attente
4. Les exécutions partielles sont supportées

#### **Quels sont les frais de trading ?**
Actuellement, aucun frais de trading n'est appliqué. Vous payez seulement les frais de gas Ethereum pour les transactions.

#### **Comment fonctionnent les dividendes ?**
- **Actions CLV/ROO** : L'émetteur peut distribuer des dividendes en TRG
- **Distribution automatique** proportionnelle aux actions détenues
- **Réclamation** via la fonction `claimDividend()` du smart contract

#### **Que faire si ma transaction est bloquée ?**
1. Vérifier que MetaMask est connecté au bon réseau
2. Vérifier que vous avez suffisamment d'ETH pour les frais de gas
3. Augmenter le gas price si nécessaire
4. Contacter le support si le problème persiste

---

## 🔧 **Fonctionnalités Avancées**

### **Order Books**
Chaque asset a son propre order book :
- **Buy Orders** : Ordres d'achat en attente
- **Sell Orders** : Ordres de vente en attente
- **Spread** : Différence entre meilleur prix d'achat et de vente
- **Depth** : Liquidité disponible à chaque niveau de prix

### **Types d'Ordres**

#### **Market Orders**
- **Exécution immédiate** au meilleur prix disponible
- **Slippage possible** si manque de liquidité
- **Recommandé** pour les petites quantités

#### **Limit Orders**
- **Prix garanti** : Exécution au prix spécifié ou mieux
- **Attente possible** : Ordre en attente jusqu'à matching
- **Contrôle total** sur le prix d'exécution

### **Partial Fills**
- **Support complet** des exécutions partielles
- **Ordre restant** reste actif après exécution partielle
- **Visibilité** des quantités exécutées vs. restantes

---

## 🛡️ **Sécurité**

### **Custody des Assets**
- **Vault Contract** : Assets stockés dans un smart contract sécurisé
- **Multi-signature** : Retraits nécessitent l'autorisation de la plateforme
- **Audit** : Contrats basés sur OpenZeppelin (standards audités)

### **Bonnes Pratiques**
1. **Vérifier** toujours les transactions dans MetaMask avant confirmation
2. **Ne jamais** partager votre clé privée
3. **Utiliser** des montants raisonnables pour les tests
4. **Déconnecter** votre wallet après utilisation
5. **Garder** vos clés privées en sécurité

### **Que faire en cas de problème ?**
1. **Vérifier** l'état de la blockchain (localhost:8545)
2. **Redémarrer** MetaMask si nécessaire
3. **Clear** le cache du navigateur
4. **Consulter** les logs de la console développeur
5. **Contacter** le support technique

---

## 📈 **Stratégies de Trading**

### **Pour les Débutants**
1. **Commencer** avec de petites quantités
2. **Utiliser** des Market Orders pour simplicité
3. **Observer** les graphiques de prix avant de trader
4. **Diversifier** entre CLV, ROO, et GOV

### **Trading des Actions (CLV/ROO)**
- **Volatilité** : Prix peuvent fluctuer selon l'offre/demande
- **Dividendes** : Revenus passifs potentiels
- **Liquidité** : Généralement bonne liquidité
- **Stratégie** : Acheter bas, vendre haut

### **Trading des Obligations (GOV)**
- **Prix stable** : 200 TRG à l'émission
- **Rendement fixe** : 10% d'intérêt garanti
- **Long terme** : Investissement d'1 an
- **Sécurité** : Gouvernement backing

### **Gestion du Stablecoin (TRG)**
- **Unité de compte** : Tous les prix en TRG
- **Réserve de valeur** : Garder du TRG pour les opportunités
- **Liquidité** : Nécessaire pour tous les trades
- **Stabilité** : Prix stable par design

---

## 🎯 **Cas d'Usage Pratiques**

### **Scenario 1 : Acheter des Actions CLV**
1. **Se connecter** avec MetaMask
2. **Aller** sur `/asset/CLV`
3. **Observer** le prix actuel (~50 TRG)
4. **Décider** : Market ou Limit Order
5. **Saisir** quantité (ex: 5 CLV)
6. **Confirmer** l'ordre
7. **Vérifier** l'exécution dans le Portfolio

### **Scenario 2 : Vendre des Actions ROO**
1. **Vérifier** balance ROO dans Portfolio
2. **Aller** sur `/asset/ROO`
3. **Choisir** "Sell at Market" pour vente rapide
4. **Ou** placer un Limit Order à prix souhaité
5. **Confirmer** dans MetaMask
6. **Recevoir** les TRG dans votre balance

### **Scenario 3 : Investir dans des Obligations**
1. **Accumuler** 200 TRG minimum
2. **Aller** sur `/asset/GOV`
3. **Acheter** à 200 TRG (prix fixe)
4. **Recevoir** l'obligation NFT
5. **Attendre** 1 an pour maturité + intérêts

---

## 🔄 **Workflow Complet**

### **Démarrage**
1. ✅ **Installer** MetaMask
2. ✅ **Configurer** réseau localhost
3. ✅ **Importer** compte de test
4. ✅ **Se connecter** à la plateforme

### **Premier Trade**
1. ✅ **Explorer** les pages assets
2. ✅ **Comprendre** les prix actuels
3. ✅ **Placer** un petit ordre de test
4. ✅ **Vérifier** l'exécution

### **Gestion Portfolio**
1. ✅ **Surveiller** les balances
2. ✅ **Retirer** les assets si nécessaire
3. ✅ **Réinvestir** les profits
4. ✅ **Diversifier** les positions

---

## 📞 **Support et Aide**

### **Resources Disponibles**
- **Documentation API** : `/docs/api/`
- **Guide Déploiement** : `/docs/deployment/`
- **Architecture** : `/docs/architecture/`
- **Smart Contracts** : `/docs/contracts/`

### **Dépannage Rapide**
| Problème | Solution |
|----------|----------|
| MetaMask ne se connecte pas | Vérifier réseau localhost:8545 |
| Transaction échoue | Augmenter gas limit |
| Prix ne s'affichent pas | Actualiser la page |
| Ordre non exécuté | Vérifier liquidité disponible |
| Assets manquants | Vérifier adresses contrats |

### **Logs Utiles**
```bash
# Backend API
curl http://localhost:3001/health

# Prix actuels
curl http://localhost:3001/api/public/trading/price/CLV

# Test base de données
curl http://localhost:3001/api/test-db
```

---

**🎯 Prêt à trader ! Commencez par de petits montants et explorez toutes les fonctionnalités de la plateforme DeFi.**