// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TriangleCoin is ERC20, Ownable {
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    constructor() ERC20("Triangle Coin", "TRG") Ownable(msg.sender) {
        _mint(msg.sender, 4000 * 10**decimals());
        emit TokensMinted(msg.sender, 4000 * 10**decimals());
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    function burn(uint256 amount) public onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance to burn");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    function burnFrom(address from, uint256 amount) public onlyOwner {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance to burn");
        
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    
    function getTokenInfo() public view returns (
        string memory,
        string memory,
        uint8,
        uint256
    ) {
        return (name(), symbol(), decimals(), totalSupply());
    }
    
    function toTokens(uint256 amount) public view returns (uint256) {
        return amount * 10**decimals();
    }
    
    function fromWei(uint256 weiAmount) public view returns (uint256) {
        return weiAmount / 10**decimals();
    }
}
