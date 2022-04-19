const { expect } = require("chai");
const { ethers } = require("hardhat");

const contractName = "ERC721WithBaseUri"
const NFT_PRICE = 0.1

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}


describe('ERC721WithBaseUri', function() {
  // Get the list of accouns in the harhat node we're connecting to
  before(async function() {
    this.accounts = await ethers.getSigners();
  })

  describe('Mint all elements', function() {

    // Deploy contract
    before(async function() {
      this.registry = await deploy(contractName, contractName, 'symbol', 'ipfs://fakeBaseUri/');
    });

    it('element', async function() {

      for (let tokenId = 1; tokenId < 101; ++tokenId) {
        await expect(this.registry.connect(this.accounts[1]).mint(this.accounts[1].address, 1, { value: ethers.utils.parseEther(NFT_PRICE.toString()) }))
        .to.emit(this.registry, 'Transfer')
        .withArgs(ethers.constants.AddressZero, this.accounts[1].address, tokenId);

        await expect(await this.registry.connect(this.accounts[1]).tokenURI(tokenId)).to.equal('ipfs://fakeBaseUri/' + tokenId);
      }
    })

    it('mint extra token - fail', async function() {

      await expect(this.registry.mint(this.accounts[1].address, 1, { value: ethers.utils.parseEther(NFT_PRICE.toString()) }))
        .to.be.revertedWith('Out of tokens');
    })
  })

  describe("Bulk mint", function() {

    // Deploy contract
    before(async function() {
      this.registry = await deploy(contractName, contractName, 'symbol', 'ipfs://fakeBaseUri');
    });

    it('mint 5 tokens - success', async function() {

      await expect(this.registry.mint(this.accounts[1].address, 5, { value: ethers.utils.parseEther((NFT_PRICE*5).toString()) }))
        .to.emit(this.registry, 'Transfer')
        .withArgs(ethers.constants.AddressZero, this.accounts[1].address, 1);
    });

    it('mint 6 tokens - fail', async function() {

      await expect(this.registry.mint(this.accounts[1].address, 6, { value: ethers.utils.parseEther((NFT_PRICE*6).toString()) }))
        .to.be.revertedWith('Can only mint 5 tokens at a time');
    });
  })

})