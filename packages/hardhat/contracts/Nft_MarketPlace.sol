// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTMarketplace is ERC721URIStorage, Ownable, ReentrancyGuard, Pausable, IERC721Receiver {

    uint256 private tokenIdCounter; 
    uint256 public fee;

    event NFTListed(uint256 indexed tokenId, uint256 price, address indexed seller);
    event NFTPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price, uint256 fee);
    event NFTDelisted(uint256 indexed tokenId, address indexed seller);
    event Paused();
    event Unpaused();

    struct Listing {
        uint256 price;
        address seller;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => mapping(uint256 => bool)) public ownerTokens; 
    event MintItemLog(address to, uint256 tokenId, string uri);

    IERC721 public nftContract;

    constructor(uint256 _feePercent, address _nftContract) ERC721("MyNFTCollection", "MNFT") Ownable(msg.sender){
        fee = _feePercent;
        nftContract = IERC721(_nftContract);
        tokenIdCounter = 0; 
    }

    modifier isTokenOwner(uint256 _tokenId) {
        require(nftContract.ownerOf(_tokenId) == msg.sender, "Not the owner");
        _;
    }

    modifier tokenNotListed(uint256 _tokenId) {
        require(!listings[_tokenId].active, "NFT is already listed");
        _;
    }

    function pause() public onlyOwner {
        _pause();
        emit Paused();
    }

    function unpause() public onlyOwner {
        _unpause();
        emit Unpaused();
    }

    function listNFT(uint256 _tokenId, uint256 _price)
        external
        isTokenOwner(_tokenId)
        tokenNotListed(_tokenId)
        whenNotPaused
    {
        require(_price > 0, "Price must be greater than zero");

        require(
            nftContract.getApproved(_tokenId) == address(this) || nftContract.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        listings[_tokenId] = Listing({
            price: _price,
            seller: msg.sender,
            active: true
        });

        ownerTokens[msg.sender][_tokenId] = true;

        emit NFTListed(_tokenId, _price, msg.sender);
    }

    function delistNFT(uint256 _tokenId) external isTokenOwner(_tokenId) whenNotPaused {
        require(listings[_tokenId].active, "NFT is not listed");

        delete listings[_tokenId];

        ownerTokens[msg.sender][_tokenId] = false;

        emit NFTDelisted(_tokenId, msg.sender);
    }

    function purchaseNFT(uint256 _tokenId)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        Listing memory listing = listings[_tokenId];

        require(listing.active, "NFT is not for sale");
        require(msg.value >= listing.price, "Insufficient funds");
        require(listing.seller != address(0), "Seller address is zero");
        require(nftContract.ownerOf(_tokenId) == listing.seller, "Seller no longer owns this NFT");

        uint256 price = listing.price;
        uint256 feeAmount = (price * fee) / 100;
        uint256 sellerAmount = price - feeAmount;

        nftContract.safeTransferFrom(listing.seller, msg.sender, _tokenId);

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
        ownerTokens[listing.seller][_tokenId] = false;

        emit NFTPurchased(msg.sender, _tokenId, price, feeAmount);
    }

    function mintItem(address to, string memory uri) public returns (uint256) {
        uint256 tokenId = tokenIdCounter;  
        tokenIdCounter++; 

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit MintItemLog(to, tokenId, uri);  
        return tokenId;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function getListing(uint256 _tokenId)
        external
        view
        returns (Listing memory)
    {
        return listings[_tokenId];
    }

    function isOwner(address _owner, uint256 _tokenId)
        external
        view
        returns (bool)
    {
        return ownerTokens[_owner][_tokenId];
    }
}
