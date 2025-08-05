// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Vault is Ownable, ReentrancyGuard {
    
    // Events
    event Deposit(address indexed user, address indexed asset, uint256 amount, bool isNFT);
    event Withdrawal(address indexed user, address indexed asset, uint256 amount, bool isNFT);
    
    // Mapping pour suivre les balances des utilisateurs
    mapping(address => mapping(address => uint256)) public tokenBalances;
    mapping(address => mapping(address => uint256[])) public nftBalances;
    
    // Assets autorisés
    mapping(address => bool) public authorizedTokens;
    mapping(address => bool) public authorizedNFTs;
    
    constructor() Ownable(msg.sender) {
        // Le deployer devient le owner (platform)
    }
    
    // Autoriser un token ERC20
    function authorizeToken(address token) external onlyOwner {
        authorizedTokens[token] = true;
    }
    
    // Autoriser un NFT ERC721
    function authorizeNFT(address nft) external onlyOwner {
        authorizedNFTs[nft] = true;
    }
    
    // Déposer des tokens ERC20
    function depositToken(address token, uint256 amount) external nonReentrant {
        require(authorizedTokens[token], "Token not authorized");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        tokenBalances[msg.sender][token] += amount;
        
        emit Deposit(msg.sender, token, amount, false);
    }
    
    // Déposer un NFT ERC721
    function depositNFT(address nft, uint256 tokenId) external nonReentrant {
        require(authorizedNFTs[nft], "NFT not authorized");
        
        IERC721(nft).transferFrom(msg.sender, address(this), tokenId);
        nftBalances[msg.sender][nft].push(tokenId);
        
        emit Deposit(msg.sender, nft, tokenId, true);
    }
    
    // FONCTION CRITIQUE: Retrait autorisé par la plateforme
    function operateWithdrawal(
        address user, 
        address asset, 
        uint256 amount,
        bool isNFT
    ) external onlyOwner nonReentrant {
        if (isNFT) {
            require(authorizedNFTs[asset], "NFT not authorized");
            uint256[] storage userNFTs = nftBalances[user][asset];
            require(userNFTs.length > 0, "No NFTs to withdraw");
            
            uint256 tokenId = userNFTs[userNFTs.length - 1];
            userNFTs.pop();
            
            IERC721(asset).transferFrom(address(this), user, tokenId);
            emit Withdrawal(user, asset, tokenId, true);
            
        } else {
            require(authorizedTokens[asset], "Token not authorized");
            require(tokenBalances[user][asset] >= amount, "Insufficient balance");
            
            tokenBalances[user][asset] -= amount;
            IERC20(asset).transfer(user, amount);
            
            emit Withdrawal(user, asset, amount, false);
        }
    }
    
    // Vérifier la balance d'un utilisateur (token)
    function getUserTokenBalance(address user, address token) external view returns (uint256) {
        return tokenBalances[user][token];
    }
    
    // Vérifier les NFTs d'un utilisateur  
    function getUserNFTs(address user, address nft) external view returns (uint256[] memory) {
        return nftBalances[user][nft];
    }
}
