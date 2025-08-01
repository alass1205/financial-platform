// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ShareToken is ERC20, Ownable {
    
    // Interface du token TRG pour les dividendes
    IERC20 public dividendToken;
    
    // Tracking des dividendes
    uint256 public totalDividendsDistributed;
    uint256 public dividendsPerShare;
    
    mapping(address => uint256) public lastDividendClaim;
    
    event DividendsDistributed(uint256 amount, uint256 perShare);
    event DividendClaimed(address indexed shareholder, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address dividendTokenAddress
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10**decimals());
        dividendToken = IERC20(dividendTokenAddress);
    }
    
    // Distribuer des dividendes (seulement le propriétaire)
    function distributeDividends(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() > 0, "No shares exist");
        
        // Transférer les TRG du propriétaire au contrat
        require(
            dividendToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Calculer les dividendes par action
        uint256 dividendsPerShareIncrease = (amount * 1e18) / totalSupply();
        dividendsPerShare += dividendsPerShareIncrease;
        totalDividendsDistributed += amount;
        
        emit DividendsDistributed(amount, dividendsPerShareIncrease);
    }
    
    // Réclamer ses dividendes
    function claimDividends() external {
        uint256 balance = balanceOf(msg.sender);
        require(balance > 0, "No shares owned");
        
        uint256 owed = (balance * dividendsPerShare) / 1e18;
        uint256 claimed = lastDividendClaim[msg.sender];
        
        require(owed > claimed, "No dividends to claim");
        
        uint256 toClaim = owed - claimed;
        lastDividendClaim[msg.sender] = owed;
        
        require(
            dividendToken.transfer(msg.sender, toClaim),
            "Dividend transfer failed"
        );
        
        emit DividendClaimed(msg.sender, toClaim);
    }
    
    // Voir les dividendes disponibles pour un utilisateur
    function availableDividends(address shareholder) external view returns (uint256) {
        uint256 balance = balanceOf(shareholder);
        if (balance == 0) return 0;
        
        uint256 owed = (balance * dividendsPerShare) / 1e18;
        uint256 claimed = lastDividendClaim[shareholder];
        
        return owed > claimed ? owed - claimed : 0;
    }
    
    // Informations sur les actions
    function getShareInfo() external view returns (
        string memory,
        string memory,
        uint256,
        uint256,
        address
    ) {
        return (
            name(),
            symbol(),
            totalSupply(),
            totalDividendsDistributed,
            address(dividendToken)
        );
    }
    
    // Override transfer pour mettre à jour les claims de dividendes
    function _update(address from, address to, uint256 value) internal override {
        // Mettre à jour les dividendes avant le transfert
        if (from != address(0) && balanceOf(from) > 0) {
            _updateDividendClaim(from);
        }
        if (to != address(0)) {
            _updateDividendClaim(to);
        }
        
        super._update(from, to, value);
    }
    
    function _updateDividendClaim(address account) internal {
        uint256 balance = balanceOf(account);
        if (balance > 0) {
            lastDividendClaim[account] = (balance * dividendsPerShare) / 1e18;
        }
    }
}
