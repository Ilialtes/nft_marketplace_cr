import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("NFT Marketplace contract", function () {
  let NFTMarketplace: any;

  const nftFixture = async () => {
    const [owner, addr1, addr2] = await ethers.getSigners();
    NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const nftMarketplace = await NFTMarketplace.deploy(5);
    return { nftMarketplace, owner, addr1, addr2 };
  };

  it("Should mint a new NFT and assign it to the owner", async function () {
    const { nftMarketplace, owner } = await loadFixture(nftFixture);

    const tokenURI = "ipfs://some-metadata-link";
    await nftMarketplace.mintItem(tokenURI);
    const ownerBalance = await nftMarketplace.balanceOf(owner.address);
    expect(ownerBalance).to.equal(1);

    const tokenId = 0;
    expect(await nftMarketplace.ownerOf(tokenId)).to.equal(owner.address);
    expect(await nftMarketplace.tokenURI(tokenId)).to.equal(tokenURI);
  });

  it("Should return true if the given address is the owner of the token", async function () {
    const { nftMarketplace, owner, addr1 } = await loadFixture(nftFixture);

    const tokenURI = "ipfs://some-metadata-link";
    await nftMarketplace.mintItem(tokenURI);

    const tokenId = 0;

    expect(await nftMarketplace.isOwner(owner.address, tokenId)).to.equal(true);
    expect(await nftMarketplace.isOwner(addr1.address, tokenId)).to.equal(false);
  });

  it("Should return owned tokens and their URIs for an owner", async function () {
    const { nftMarketplace, owner } = await loadFixture(nftFixture);

    const tokenURI1 = "ipfs://some-metadata-link-1";
    const tokenURI2 = "ipfs://some-metadata-link-2";
    const tokenURI3 = "ipfs://some-metadata-link-3";

    await nftMarketplace.mintItem(tokenURI1);
    await nftMarketplace.mintItem(tokenURI2);
    await nftMarketplace.mintItem(tokenURI3);

    const [tokenIds, uris] = await nftMarketplace.getOwnedTokens(owner.address);

    expect(tokenIds.length).to.equal(3);
    expect(tokenIds[0]).to.equal(0);
    expect(tokenIds[1]).to.equal(1);
    expect(tokenIds[2]).to.equal(2);

    expect(uris[0]).to.equal(tokenURI1);
    expect(uris[1]).to.equal(tokenURI2);
    expect(uris[2]).to.equal(tokenURI3);
  });
});
