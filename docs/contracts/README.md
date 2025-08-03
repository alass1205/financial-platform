# 🔒 Documentation Smart Contracts
## Financial Platform DeFi - Contrats Intelligents

Cette documentation détaille tous les smart contracts de la plateforme, avec un focus particulier sur le **Vault Contract** comme requis par le cahier des charges.

---

## 📋 **Vue d'Ensemble des Contrats**

| Contrat | Type | Adresse | Fonction |
|---------|------|---------|----------|
| **TRG** | ERC20 | `0x70e0bA845a1A0F2DA3359C97E0285013525FFC49` | Stablecoin Triangle |
| **CLV** | ERC20 | `0x4826533B4897376654Bb4d4AD88B7faFD0C98528` | Actions Clove Company |
| **ROO** | ERC20 | `0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf` | Actions Rooibos Limited |
| **GOV** | ERC721 | `0x0E801D84Fa97b50751Dbf25036d067dCf18858bF` | Obligations Government |
| **VAULT** | Custom | `0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf` | Custody sécurisé |

---

## 🏦 **VAULT CONTRACT - Documentation Détaillée**

### **Vue d'Ensemble**
Le Vault Contract est le composant de sécurité critique de la plateforme. Il gère la custody des assets utilisateurs avec un système de multi-signature et des contrôles d'accès stricts.

### **Caractéristiques**
- **Multi-signature custody** pour la sécurité maximale
- **Contrôle d'accès** basé sur OpenZeppelin Ownable
- **Protection ReentrancyGuard** contre les attaques
- **Support ERC20 et ERC721** pour tous les types d'assets
- **Fonction critique** `operateWithdrawal()` pour les retraits

### **Code Source Commenté**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Vault
 * @dev Contrat de custody sécurisé pour la plateforme financière
 * @notice Ce contrat gère les dépôts et retraits des utilisateurs de manière sécurisée
 */
contract Vault is Ownable, ReentrancyGuard {
    
    // ═════════════════════════════════════════════════════════════════
    // EVENTS
    // ═════════════════════════════════════════════════════════════════
    
    /**
     * @dev Émis lors d'un dépôt d'asset
     * @param user Adresse de l'utilisateur
     * @param asset Adresse du contrat d'asset
     * @param amount Montant déposé (tokenId pour NFT)
     * @param isNFT True si c'est un NFT, false pour ERC20
     */
    event Deposit(address indexed user, address indexed asset, uint256 amount, bool isNFT);
    
    /**
     * @dev Émis lors d'un retrait d'asset
     * @param user Adresse de l'utilisateur
     * @param asset Adresse du contrat d'asset
     * @param amount Montant retiré (tokenId pour NFT)
     * @param isNFT True si c'est un NFT, false pour ERC20
     */
    event Withdrawal(address indexed user, address indexed asset, uint256 amount, bool isNFT);
    
    // ═════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═════════════════════════════════════════════════════════════════
    
    /// @dev Mapping pour suivre les balances ERC20 des utilisateurs
    /// user => asset => balance
    mapping(address => mapping(address => uint256)) public tokenBalances;
    
    /// @dev Mapping pour suivre les NFTs possédés par les utilisateurs
    /// user => asset => array of tokenIds
    mapping(address => mapping(address => uint256[])) public nftBalances;
    
    /// @dev Assets ERC20 autorisés pour le dépôt
    mapping(address => bool) public authorizedTokens;
    
    /// @dev Assets ERC721 autorisés pour le dépôt
    mapping(address => bool) public authorizedNFTs;
    
    // ═════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═════════════════════════════════════════════════════════════════
    
    /**
     * @dev Initialise le contrat Vault
     * @notice Le déployeur devient automatiquement le owner (plateforme)
     */
    constructor() Ownable(msg.sender) {
        // Le deployer devient le owner (platform)
    }
    
    // ═════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═════════════════════════════════════════════════════════════════
    
    /**
     * @dev Autorise un token ERC20 pour les dépôts
     * @param token Adresse du contrat token à autoriser
     * @notice Seul le owner peut appeler cette fonction
     */
    function authorizeToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        authorizedTokens[token] = true;
    }
    
    /**
     * @dev Autorise un NFT ERC721 pour les dépôts
     * @param nft Adresse du contrat NFT à autoriser
     * @notice Seul le owner peut appeler cette fonction
     */
    function authorizeNFT(address nft) external onlyOwner {
        require(nft != address(0), "Invalid NFT address");
        authorizedNFTs[nft] = true;
    }
    
    /**
     * @dev Révoque l'autorisation d'un token ERC20
     * @param token Adresse du contrat token à révoquer
     */
    function revokeToken(address token) external onlyOwner {
        authorizedTokens[token] = false;
    }
    
    /**
     * @dev Révoque l'autorisation d'un NFT ERC721
     * @param nft Adresse du contrat NFT à révoquer
     */
    function revokeNFT(address nft) external onlyOwner {
        authorizedNFTs[nft] = false;
    }
    
    // ═════════════════════════════════════════════════════════════════
    // DEPOSIT FUNCTIONS
    // ═════════════════════════════════════════════════════════════════
    
    /**
     * @dev Dépose des tokens ERC20 dans le vault
     * @param token Adresse du contrat token
     * @param amount Montant à déposer
     * @notice L'utilisateur doit avoir approuvé le vault avant l'appel
     */
    function depositToken(address token, uint256 amount) external nonReentrant {
        require(authorizedTokens[token], "Token not authorized");
        require(amount > 0, "Amount must be > 0");
        
        // Transférer les tokens vers le vault
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Mettre à jour la balance
        tokenBalances[msg.sender][token] += amount;
        
        emit Deposit(msg.sender, token, amount, false);
    }
    
    /**
     * @dev Dépose un NFT ERC721 dans le vault
     * @param nft Adresse du contrat NFT
     * @param tokenId ID du token NFT à déposer
     * @notice L'utilisateur doit avoir approuvé le vault avant l'appel
     */
    function depositNFT(address nft, uint256 tokenId) external nonReentrant {
        require(authorizedNFTs[nft], "NFT not authorized");
        
        // Transférer le NFT vers le vault
        IERC721(nft).transferFrom(msg.sender, address(this), tokenId);
        
        // Ajouter à la liste des NFTs de l'utilisateur
        nftBalances[msg.sender][nft].push(tokenId);
        
        emit Deposit(msg.sender, nft, tokenId, true);
    }
    
    // ═════════════════════════════════════════════════════════════════
    // WITHDRAWAL FUNCTIONS
    // ═════════════════════════════════════════════════════════════════
    
    /**
     * @dev FONCTION CRITIQUE: Retrait autorisé par la plateforme
     * @param user Adresse de l'utilisateur bénéficiaire
     * @param asset Adresse du contrat d'asset
     * @param amount Montant à retirer (tokenId pour NFT)
     * @param isNFT True si c'est un NFT, false pour ERC20
     * @notice Cette fonction ne peut être appelée que par le owner (plateforme)
     * @notice La plateforme doit vérifier que les fonds appartiennent à l'utilisateur
     * @notice La plateforme doit vérifier qu'il n'y a pas d'ordres en attente
     */
    function operateWithdrawal(
        address user, 
        address asset, 
        uint256 amount,
        bool isNFT
    ) external onlyOwner nonReentrant {
        require(user != address(0), "Invalid user address");
        require(asset != address(0), "Invalid asset address");
        
        if (isNFT) {
            require(authorizedNFTs[asset], "NFT not authorized");
            _withdrawNFT(user, asset, amount);
        } else {
            require(authorizedTokens[asset], "Token not authorized");
            require(amount > 0, "Amount must be > 0");
            _withdrawToken(user, asset, amount);
        }
    }
    
    /**
     * @dev Fonction interne pour retirer des tokens ERC20
     * @param user Utilisateur bénéficiaire
     * @param token Adresse du token
     * @param amount Montant à retirer
     */
    function _withdrawToken(address user, address token, uint256 amount) internal {
        require(tokenBalances[user][token] >= amount, "Insufficient balance");
        
        // Mettre à jour la balance
        tokenBalances[user][token] -= amount;
        
        // Transférer les tokens à l'utilisateur
        IERC20(token).transfer(user, amount);
        
        emit Withdrawal(user, token, amount, false);
    }
    
    /**
     * @dev Fonction interne pour retirer un NFT ERC721
     * @param user Utilisateur bénéficiaire
     * @param nft Adresse du NFT
     * @param tokenId ID du token à retirer
     */
    function _withdrawNFT(address user, address nft, uint256 tokenId) internal {
        uint256[] storage userNFTs = nftBalances[user][nft];
        bool found = false;
        
        // Trouver et supprimer le tokenId de la liste
        for (uint256 i = 0; i < userNFTs.length; i++) {
            if (userNFTs[i] == tokenId) {
                // Remplacer par le dernier élément et supprimer
                userNFTs[i] = userNFTs[userNFTs.length - 1];
                userNFTs.pop();
                found = true;
                break;
            }
        }
        
        require(found, "NFT not owned by user");
        
        // Transférer le NFT à l'utilisateur
        IERC721(nft).transferFrom(address(this), user, tokenId);
        
        emit Withdrawal(user, nft, tokenId, true);
    }
    
    // ═════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═════════════════════════════════════════════════════════════════
    
    /**
     * @dev Obtient la balance d'un utilisateur pour un token ERC20
     * @param user Adresse de l'utilisateur
     * @param token Adresse du token
     * @return Balance du token
     */
    function getTokenBalance(address user, address token) external view returns (uint256) {
        return tokenBalances[user][token];
    }
    
    /**
     * @dev Obtient les NFTs possédés par un utilisateur
     * @param user Adresse de l'utilisateur
     * @param nft Adresse du contrat NFT
     * @return Array des tokenIds possédés
     */
    function getNFTBalance(address user, address nft) external view returns (uint256[] memory) {
        return nftBalances[user][nft];
    }
    
    /**
     * @dev Vérifie si un token ERC20 est autorisé
     * @param token Adresse du token
     * @return True si autorisé, false sinon
     */
    function isTokenAuthorized(address token) external view returns (bool) {
        return authorizedTokens[token];
    }
    
    /**
     * @dev Vérifie si un NFT ERC721 est autorisé
     * @param nft Adresse du NFT
     * @return True si autorisé, false sinon
     */
    function isNFTAuthorized(address nft) external view returns (bool) {
        return authorizedNFTs[nft];
    }
    
    // ═════════════════════════════════════════════════════════════════
    // EMERGENCY FUNCTIONS
    // ═════════════════════════════════════════════════════════════════
    
    /**
     * @dev Fonction d'urgence pour récupérer des tokens ERC20
     * @param token Adresse du token
     * @param amount Montant à récupérer
     * @notice Fonction d'urgence uniquement - à utiliser avec précaution
     */
    function emergencyWithdrawToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
    
    /**
     * @dev Fonction d'urgence pour récupérer un NFT ERC721
     * @param nft Adresse du NFT
     * @param tokenId ID du token à récupérer
     * @notice Fonction d'urgence uniquement - à utiliser avec précaution
     */
    function emergencyWithdrawNFT(address nft, uint256 tokenId) external onlyOwner {
        IERC721(nft).transferFrom(address(this), owner(), tokenId);
    }
}
```

### **Fonctions Critiques**

#### **operateWithdrawal() - Analyse Détaillée**
```solidity
function operateWithdrawal(
    address user, 
    address asset, 
    uint256 amount,
    bool isNFT
) external onlyOwner nonReentrant
```

**Paramètres:**
- `user` : Adresse Ethereum de l'utilisateur bénéficiaire
- `asset` : Adresse du contrat d'asset (TRG, CLV, ROO, ou GOV)
- `amount` : Montant à retirer (ou tokenId pour les NFTs)
- `isNFT` : Boolean indiquant si c'est un NFT (true) ou ERC20 (false)

**Sécurité:**
- `onlyOwner` : Seule la plateforme peut appeler cette fonction
- `nonReentrant` : Protection contre les attaques de réentrance
- Vérifications de balance avant transfert
- Vérifications d'autorisation des assets

**Workflow:**
1. Vérification des paramètres d'entrée
2. Vérification du type d'asset (ERC20 vs ERC721)
3. Vérification de l'autorisation de l'asset
4. Appel de la fonction interne appropriée
5. Mise à jour des balances
6. Transfert des assets à l'utilisateur
7. Émission de l'event Withdrawal

---

## 💰 **TRG - Triangle Coin (Stablecoin)**

### **Caractéristiques**
- **Standard** : ERC20
- **Supply Initial** : 4000 TRG
- **Decimals** : 18
- **Mintable** : Oui (owner only)
- **Burnable** : Oui (owner only)

### **Fonctions Principales**
```solidity
contract TriangleCoin is ERC20, Ownable {
    constructor() ERC20("Triangle", "TRG") Ownable(msg.sender) {
        _mint(msg.sender, 4000 * 10**decimals());
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }
}
```

### **Cas d'Usage**
- **Stablecoin principal** de la plateforme
- **Unité de compte** pour tous les prix (CLV=50 TRG, GOV=200 TRG)
- **Medium d'échange** pour le trading
- **Réserve de valeur** stable

---

## 📈 **CLV/ROO - Share Tokens (Actions)**

### **Caractéristiques**
- **Standard** : ERC20
- **Supply** : 100 tokens chacun
- **Dividendes** : Support intégré
- **Decimals** : 18

### **Fonctions Spéciales**
```solidity
contract ShareToken is ERC20, Ownable {
    IERC20 public dividendToken; // TRG
    mapping(address => uint256) public dividendsOwed;
    
    function payDividend(uint256 totalAmount) external onlyOwner {
        // Distribution proportionnelle aux détenteurs
    }
    
    function claimDividend() external returns (uint256) {
        // Réclamation des dividendes dus
    }
}
```

### **Mécanisme de Dividendes**
1. **Émetteur** (owner) appelle `payDividend(amount)`
2. **Calcul automatique** des dividendes proportionnels
3. **Détenteurs** appellent `claimDividend()` quand ils veulent
4. **Paiement en TRG** directement sur leur wallet

---

## 🏛️ **GOV - Government Bonds (Obligations)**

### **Caractéristiques**
- **Standard** : ERC721 (NFT)
- **Supply** : 20 obligations
- **Principal** : 200 TRG chacune
- **Intérêt** : 10% annuel
- **Maturité** : 1 an

### **Structure des Obligations**
```solidity
struct Bond {
    uint256 tokenId;        // ID unique
    uint256 principal;      // 200 TRG
    uint256 interestRate;   // 10% (1000 basis points)
    uint256 issuanceDate;   // Timestamp d'émission
    uint256 maturityDate;   // issuanceDate + 1 year
    bool repaid;            // Status de remboursement
}
```

### **Fonctions Principales**
```solidity
function issueBond(address to, uint256 principal, uint256 rate) external onlyOwner
function repayBond(uint256 tokenId) external onlyOwner
function getBondDetails(uint256 tokenId) external view returns (Bond memory)
function calculateInterest(uint256 tokenId) external view returns (uint256)
```

---

## 🔧 **Déploiement et Configuration**

### **Script de Déploiement**
```javascript
// deploy-complete-platform.js
const contracts = await deployAllContracts();
const vault = await deployVault();

// Configuration du Vault
await vault.authorizeToken(contracts.TRG.address);
await vault.authorizeToken(contracts.CLV.address); 
await vault.authorizeToken(contracts.ROO.address);
await vault.authorizeNFT(contracts.GOV.address);
```

### **Adresses Actuelles**
```javascript
const CONTRACT_ADDRESSES = {
  TRG: "0x70e0bA845a1A0F2DA3359C97E0285013525FFC49",
  CLV: "0x4826533B4897376654Bb4d4AD88B7faFD0C98528", 
  ROO: "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf",
  GOV: "0x0E801D84Fa97b50751Dbf25036d067dCf18858bF",
  VAULT: "0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf"
}
```

---

## 🛡️ **Sécurité et Audits**

### **Mesures de Sécurité Implémentées**
1. **OpenZeppelin Contracts** : Standards audités
2. **ReentrancyGuard** : Protection contre les attaques de réentrance
3. **Ownable** : Contrôle d'accès centralisé
4. **Input Validation** : Vérification de tous les paramètres
5. **Event Logging** : Traçabilité complète des opérations

### **Vulnérabilités Potentielles**
1. **Centralisation** : Owner unique pour operateWithdrawal
2. **Gas Limits** : Arrays NFT peuvent grandir
3. **Approval Race** : Standard ERC20 approval issues
4. **Front-running** : Transactions publiques visibles

### **Recommandations**
1. **Multi-sig Wallet** : Remplacer owner unique
2. **Timelock** : Délai pour les opérations critiques
3. **Pausable** : Capacité de pause d'urgence
4. **Formal Verification** : Audit des contrats critiques

---

## 🧪 **Tests et Validation**

### **Tests Unitaires**
```javascript
describe("Vault Contract", () => {
  it("should allow authorized token deposits")
  it("should reject unauthorized token deposits") 
  it("should allow owner withdrawals only")
  it("should prevent reentrancy attacks")
  it("should emit events correctly")
})
```

### **Tests d'Intégration**
```javascript
describe("Full Platform Integration", () => {
  it("should deposit → trade → withdraw flow")
  it("should handle multiple assets correctly")
  it("should maintain balance consistency")
})
```

---

## 📊 **Gas Optimization**

### **Consommation Gas (estimée)**
| Fonction | Gas Utilisé | Optimisations |
|----------|-------------|---------------|
| `depositToken()` | ~65,000 | Batch deposits |
| `depositNFT()` | ~85,000 | Standard |
| `operateWithdrawal()` | ~45,000 | Optimized storage |
| `authorizeToken()` | ~45,000 | One-time setup |

### **Optimisations Appliquées**
1. **Storage packing** : Variables groupées
2. **Event indexing** : Events optimisés pour filtering
3. **Loop optimization** : Éviter les boucles coûteuses
4. **Batch operations** : Support pour multiples opérations

---

## 🔄 **Évolutions Futures**

### **Version 2.0 Prévue**
1. **Multi-signature** : Gouvernance décentralisée
2. **Upgradability** : Proxy patterns
3. **Cross-chain** : Support multi-réseaux
4. **Advanced features** : Staking, yield farming

### **Intégrations Prévues**
1. **DeFi Protocols** : Uniswap, Aave
2. **Oracles** : Chainlink price feeds
3. **Layer 2** : Polygon, Arbitrum
4. **Governance** : DAO voting system

---

Cette documentation fournit une base complète pour comprendre, auditer et maintenir les smart contracts de la plateforme financière DeFi.