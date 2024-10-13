// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTMarketplace is ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    uint256 private tokenIdCounter; 
    uint256 public fee;

    // Mapping to keep track of which tokens are owned by each address
    mapping(address => uint256[]) private addressToTokens;

    event NFTListed(uint256 indexed tokenId, uint256 price, address indexed seller);
    event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 fee);
    event NFTDelisted(uint256 indexed tokenId, address indexed seller);
    event MintItemLog(address to, uint256 tokenId, string uri);

    struct Listing {
        uint256 price;
        address seller;
        bool active;
    }

    mapping(uint256 => Listing) public listings;

    constructor(uint256 _feePercent) ERC721("MyNFTCollection", "MNFT") Ownable(msg.sender) {
        fee = _feePercent;
        tokenIdCounter = 0; 
    }

    modifier onlyTokenOwner(uint256 _tokenId) {
        require(ownerOf(_tokenId) == msg.sender, "You do not own this NFT");
        _;
    }

    modifier isListed(uint256 _tokenId) {
        require(listings[_tokenId].active, "NFT is not listed for sale");
        _;
    }

    modifier isNotListed(uint256 _tokenId) {
        require(!listings[_tokenId].active, "NFT is already listed for sale");
        _;
    }

    modifier isMarketplaceApproved(uint256 _tokenId) {
        require(
            getApproved(_tokenId) == address(this) || isApprovedForAll(msg.sender, address(this)),
            "Marketplace is not approved to transfer this NFT"
        );
        _;
    }

    function mintItem(string memory uri) public returns (uint256) {
        uint256 tokenId = tokenIdCounter;
        tokenIdCounter++;  

        // Mint the token to the msg.sender and set its URI
        _safeMint(msg.sender, tokenId); 
        _setTokenURI(tokenId, uri); 

        // Track the token in the addressToTokens mapping
        addressToTokens[msg.sender].push(tokenId);

        emit MintItemLog(msg.sender, tokenId, uri); 
        return tokenId;  
    }

    function listNFT(uint256 _tokenId, uint256 _price)
        external
        whenNotPaused
        onlyTokenOwner(_tokenId)
        isNotListed(_tokenId)
        isMarketplaceApproved(_tokenId)
    {
        require(_price > 0, "Price must be greater than zero");

        listings[_tokenId] = Listing({
            price: _price,
            seller: msg.sender,
            active: true
        });

        emit NFTListed(_tokenId, _price, msg.sender);
    }

    function delistNFT(uint256 _tokenId)
        external
        whenNotPaused
        onlyTokenOwner(_tokenId)
        isListed(_tokenId)
    {
        delete listings[_tokenId];

        emit NFTDelisted(_tokenId, msg.sender);
    }

    function purchaseNFT(uint256 _tokenId)
        external
        payable
        whenNotPaused
        nonReentrant
        isListed(_tokenId)
    {
        Listing memory listing = listings[_tokenId];
        require(msg.value >= listing.price, "Insufficient funds");
        require(ownerOf(_tokenId) == listing.seller, "Seller no longer owns this NFT");

        uint256 price = listing.price;
        uint256 feeAmount = (price * fee) / 100;
        uint256 sellerAmount = price - feeAmount;

        _transfer(listing.seller, msg.sender, _tokenId);

        _removeTokenFromOwner(listing.seller, _tokenId);
        addressToTokens[msg.sender].push(_tokenId);

        (bool sentToOwner, ) = owner().call{value: feeAmount}("");
        require(sentToOwner, "Failed to send fee to owner");

        (bool sentToSeller, ) = listing.seller.call{value: sellerAmount}("");
        require(sentToSeller, "Failed to send amount to seller");

        uint256 excessAmount = msg.value - price;
        if (excessAmount > 0) {
            (bool refunded, ) = msg.sender.call{value: excessAmount}("");
            require(refunded, "Failed to refund excess amount");
        }

        listings[_tokenId].active = false;

        emit NFTPurchased(msg.sender, _tokenId, price, feeAmount);
    }

    function getListing(uint256 _tokenId) external view returns (Listing memory) {
        return listings[_tokenId];
    }

    function isOwner(address _owner, uint256 _tokenId) external view returns (bool) {
        return ownerOf(_tokenId) == _owner;
    }

    function getOwnedTokenURIs(address owner) external view returns (string[] memory) {
        uint256 tokenCount = addressToTokens[owner].length;
        string[] memory uris = new string[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            uint256 tokenId = addressToTokens[owner][i];
            uris[i] = tokenURI(tokenId);
        }

        return uris;
    }

    function _removeTokenFromOwner(address owner, uint256 tokenId) internal {
        uint256[] storage tokens = addressToTokens[owner];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1]; 
                tokens.pop(); 
                break;
            }
        }
    }
}
