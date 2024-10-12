// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract NFTMarketplace is Ownable, ReentrancyGuard, Pausable, IERC721Receiver {
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
    mapping(address => mapping(uint256 => bool)) public ownerTokens; // Nested mapping to track ownership

    IERC721 public nftContract;

    constructor(uint256 _feePercent, address _nftContract) Ownable(msg.sender) {
        fee = _feePercent;
        nftContract = IERC721(_nftContract);
    }

    modifier isTokenOwner(uint256 _tokenId) {
        require(nftContract.ownerOf(_tokenId) == msg.sender, "Not the owner");
        _;
    }

    modifier tokenNotListed(uint256 _tokenId) {
        require(!listings[_tokenId].active, "NFT is already listed");
        _;
    }

    function pause() public  {
        _pause();
        emit Paused();
    }

    function unpause() public  {
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

        // The user must approve the contract before listing
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

        // Checks at the beginning
        require(listing.active, "NFT is not for sale");
        require(msg.value >= listing.price, "Insufficient funds");
        require(listing.seller != address(0), "Seller address is zero");
        require(nftContract.ownerOf(_tokenId) == listing.seller, "Seller no longer owns this NFT");

        uint256 price = listing.price;
        uint256 feeAmount = (price * fee) / 100;
        uint256 sellerAmount = price - feeAmount;

        // Transfer the NFT to the buyer
        nftContract.safeTransferFrom(listing.seller, msg.sender, _tokenId);

        // Transfer the fee to the owner of the marketplace
        (bool sentToOwner, ) = owner().call{value: feeAmount}("");
        require(sentToOwner, "Failed to send fee to owner");

        // Transfer the remaining funds to the seller
        (bool sentToSeller, ) = listing.seller.call{value: sellerAmount}("");
        require(sentToSeller, "Failed to send amount to seller");

        // Refund any excess funds to the buyer
        uint256 excessAmount = msg.value - price;
        if (excessAmount > 0) {
            (bool refunded, ) = msg.sender.call{value: excessAmount}("");
            require(refunded, "Failed to refund excess amount");
        }

        // Update listing status
        listings[_tokenId].active = false;
        ownerTokens[listing.seller][_tokenId] = false;

        emit NFTPurchased(msg.sender, _tokenId, price, feeAmount);
    }

    // Required function for safeTransferFrom to work
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
