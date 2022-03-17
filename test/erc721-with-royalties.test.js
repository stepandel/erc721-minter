const { expect } = require("chai");
const { ethers } = require("hardhat");

const contractName = "ERC721WithRoyalties"
const eip712Version = "1.0.0"
const METADATA_URL = "https://ipfs.io/ipfs/bafyreiatzkx2rlalufspdhvu5f7snxobsoun3vzcdkzehujvlwq4ilk6ju/metadata.json"
const NFT_PRICE = '0.1'
const ROYALTY = 800;
const PURCHASE_PRICE = 1;

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}


describe('ERC721WithRoyalties', function() {
  // Get the list of accouns in the harhat node we're connecting to
  before(async function() {
    this.accounts = await ethers.getSigners();
    ({ chainId: this.chainId } = await ethers.provider.getNetwork());
  })

  describe('Mint first token', function() {

    // Deploy contract
    before(async function() {
      this.registry = await deploy(contractName, contractName, 'symbol');

      // Grant MINTER_ROLE to the account we're gonna be minting from
      await this.registry.grantRole(await this.registry.MINTER_ROLE(), this.accounts[1].address);
    });

    // TODO: - Mint all 100 tokens

    it('element', async function() {
      /**
       * Account[1] (minter) creates signature
       */

      const tokenId = "1"
      const account = "0x0904b2214f21bdEc6f567469b57cc9444D4f4DdB" // Any account works??? 

      const signature = await this.accounts[1]._signTypedData(
        // Domain
        {
          name: contractName,
          version: eip712Version,
          chainId: this.chainId,
          verifyingContract: this.registry.address
        },

        // Types
        {
          NFT: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'account', type: 'address' },
          ],
        },

        // Value
        { tokenId, account }
      );

      /**
       * Account[2] (anyone?) redeems token using signature
       */
      await expect(this.registry.connect(this.accounts[2]).redeem(account, tokenId, METADATA_URL, signature, { value: ethers.utils.parseEther(NFT_PRICE) }))
       .to.emit(this.registry, 'Transfer')
       .withArgs(ethers.constants.AddressZero, account, tokenId);
    })
  })

  describe("Dublicate Mint", function() {

    // Deploy contract
    before(async function() {
      this.registry = await deploy(contractName, contractName, 'symbol');

      // Grant MINTER_ROLE to the account we're gonna be minting from
      await this.registry.grantRole(await this.registry.MINTER_ROLE(), this.accounts[1].address);


      /**
       * Account[1] (minter) creates signature
       */

      this.token = {
        tokenId: "1",
        account: "0x0904b2214f21bdEc6f567469b57cc9444D4f4DdB"
      }

      this.token.signature = await this.accounts[1]._signTypedData(
        // Domain
        {
          name: contractName,
          version: eip712Version,
          chainId: this.chainId,
          verifyingContract: this.registry.address
        },

        // Types
        {
          NFT: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'account', type: 'address' },
          ],
        },

        // Value
        this.token,
      );
    });

    it('mint once - success', async function() {
      await expect(this.registry.redeem(this.token.account, this.token.tokenId, METADATA_URL, this.token.signature, { value: ethers.utils.parseEther(NFT_PRICE) }))
        .to.emit(this.registry, 'Transfer')
        .withArgs(ethers.constants.AddressZero, this.token.account, this.token.tokenId);
    });

    it('mint twice - fail', async function() {
      await expect(this.registry.redeem(this.token.account, this.token.tokenId, METADATA_URL, this.token.signature, { value: ethers.utils.parseEther(NFT_PRICE) }))
        .to.be.revertedWith('ERC721: token already minted');
    });
  })


  describe("Frontrun", function() {

    // Deploy contract
    before(async function() {
      this.registry = await deploy(contractName, contractName, 'symbol');

      // Grant MINTER_ROLE to the account we're gonna be minting from
      await this.registry.grantRole(await this.registry.MINTER_ROLE(), this.accounts[1].address);


      /**
       * Account[1] (minter) creates signature
       */

      this.token = {
        tokenId: "1",
        account: "0x0904b2214f21bdEc6f567469b57cc9444D4f4DdB"
      }

      this.token.signature = await this.accounts[1]._signTypedData(
        // Domain
        {
          name: contractName,
          version: eip712Version,
          chainId: this.chainId,
          verifyingContract: this.registry.address
        },

        // Types
        {
          NFT: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'account', type: 'address' },
          ],
        },

        // Value
        this.token,
      );
    });

    it('Change owner - fail', async function() {
      await expect(this.registry.redeem(this.accounts[0].address, this.token.tokenId, METADATA_URL, this.token.signature, { value: ethers.utils.parseEther(NFT_PRICE) }))
        .to.be.revertedWith('Invalid Signature')
    })
  })

  describe("Royalties", function() {

    // Deploy contract
    before(async function() {
      this.registry = await deploy(contractName, contractName, 'symbol');

      // Mint 1 token
      await this.registry.mintNFT(this.accounts[0].address, 1, METADATA_URL);
    });

    it("Royalty Info", async function() {
      
      await expect(
        ethers.utils.formatEther(
          (await this.registry.royaltyInfo(
            1,
            ethers.utils.parseEther(PURCHASE_PRICE.toString())
          ))[1]
        )
      )
      .to.equal(( ROYALTY * PURCHASE_PRICE / 10000 ).toString());
    })
  })

  describe("Admin Tasks", function() {

    // Deploy contract
    before(async function() {
      this.registry = await deploy(contractName, contractName, 'symbol');
    });

    it('mint as owner', async function() {
      await expect(this.registry.mintNFT(this.accounts[0].address, 2, METADATA_URL))
      .to.emit(this.registry, 'Transfer')
      .withArgs(ethers.constants.AddressZero, this.accounts[0].address, 2);
    })
  })
})