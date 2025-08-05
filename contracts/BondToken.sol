// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BondToken is ERC721, ERC721Enumerable, Ownable {
    
    IERC20 public paymentToken;
    
    struct Bond {
        uint256 serialNumber;
        uint256 principal;
        uint256 interestRate;
        uint256 issuanceDate;
        uint256 maturityDate;
        address currentOwner;
        bool isRepaid;
        uint256 totalRepayment;
    }
    
    mapping(uint256 => Bond) public bonds;
    mapping(uint256 => bool) private _tokenExists;
    uint256 public nextSerialNumber = 1;
    uint256 public totalBondsIssued;
    uint256 public totalValueIssued;
    uint256 public totalRepaid;
    
    event BondIssued(uint256 indexed tokenId, uint256 serialNumber, uint256 principal, address to);
    event BondRepaid(uint256 indexed tokenId, uint256 amount, address to);
    event BondTransferred(uint256 indexed tokenId, address from, address to);
    
    constructor(address paymentTokenAddress) 
        ERC721("Government Bonds", "GOV") 
        Ownable(msg.sender) 
    {
        paymentToken = IERC20(paymentTokenAddress);
    }
    
    function issueBond(
        address to,
        uint256 principal,
        uint256 interestRate,
        uint256 durationInDays
    ) external onlyOwner returns (uint256) {
        require(to != address(0), "Cannot issue to zero address");
        require(principal > 0, "Principal must be greater than 0");
        require(interestRate > 0, "Interest rate must be greater than 0");
        require(durationInDays > 0, "Duration must be greater than 0");
        
        uint256 tokenId = nextSerialNumber;
        uint256 issuanceDate = block.timestamp;
        uint256 maturityDate = issuanceDate + (durationInDays * 1 days);
        uint256 totalRepayment = principal + (principal * interestRate / 10000);
        
        bonds[tokenId] = Bond({
            serialNumber: tokenId,
            principal: principal,
            interestRate: interestRate,
            issuanceDate: issuanceDate,
            maturityDate: maturityDate,
            currentOwner: to,
            isRepaid: false,
            totalRepayment: totalRepayment
        });
        
        _mint(to, tokenId);
        _tokenExists[tokenId] = true;
        
        totalBondsIssued++;
        totalValueIssued += principal;
        nextSerialNumber++;
        
        emit BondIssued(tokenId, tokenId, principal, to);
        
        return tokenId;
    }
    
    function repayBond(uint256 tokenId) external onlyOwner {
        require(_tokenExists[tokenId], "Bond does not exist");
        require(!bonds[tokenId].isRepaid, "Bond already repaid");
        require(block.timestamp >= bonds[tokenId].maturityDate, "Bond not yet mature");
        
        address bondOwner = ownerOf(tokenId);
        uint256 repaymentAmount = bonds[tokenId].totalRepayment;
        
        bonds[tokenId].isRepaid = true;
        totalRepaid += repaymentAmount;
        
        require(
            paymentToken.transferFrom(msg.sender, bondOwner, repaymentAmount),
            "Repayment transfer failed"
        );
        
        emit BondRepaid(tokenId, repaymentAmount, bondOwner);
    }
    
    function getBondDetails(uint256 tokenId) external view returns (
        uint256 serialNumber,
        uint256 principal,
        uint256 interestRate,
        uint256 issuanceDate,
        uint256 maturityDate,
        address currentOwner,
        bool isRepaid,
        uint256 totalRepayment,
        bool isMature
    ) {
        require(_tokenExists[tokenId], "Bond does not exist");
        
        Bond memory bond = bonds[tokenId];
        
        return (
            bond.serialNumber,
            bond.principal,
            bond.interestRate,
            bond.issuanceDate,
            bond.maturityDate,
            bond.currentOwner,
            bond.isRepaid,
            bond.totalRepayment,
            block.timestamp >= bond.maturityDate
        );
    }
    
    function getBondsByOwner(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory result = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            result[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return result;
    }
    
    function calculateInterest(uint256 tokenId) external view returns (uint256) {
        require(_tokenExists[tokenId], "Bond does not exist");
        
        Bond memory bond = bonds[tokenId];
        return (bond.principal * bond.interestRate) / 10000;
    }
    
    function daysToTimestamp(uint256 numDays) external pure returns (uint256) {
        return numDays * 1 days;
    }
    
    function bondExists(uint256 tokenId) external view returns (bool) {
        return _tokenExists[tokenId];
    }
    
    function getGlobalStats() external view returns (
        uint256 totalIssued,
        uint256 totalValue,
        uint256 totalRepaidAmount,
        uint256 outstandingBonds
    ) {
        uint256 outstanding = 0;
        
        for (uint256 i = 1; i < nextSerialNumber; i++) {
            if (_tokenExists[i] && !bonds[i].isRepaid) {
                outstanding++;
            }
        }
        
        return (
            totalBondsIssued,
            totalValueIssued,
            totalRepaid,
            outstanding
        );
    }
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address previousOwner = super._update(to, tokenId, auth);
        
        if (_tokenExists[tokenId]) {
            bonds[tokenId].currentOwner = to;
            
            if (previousOwner != address(0) && to != address(0)) {
                emit BondTransferred(tokenId, previousOwner, to);
            }
        }
        
        return previousOwner;
    }
    
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
