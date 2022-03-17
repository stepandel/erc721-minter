# Base ERC721 Contract with EIP712 Signature for Lazy Minting

## IPFS File Storage

### Challenges with datastorage for NFTs

1. The actual NFT assets cannot be stored on the blockchain due to very high costs. Solution: Storing the asset off-chain

2. The key (link) to the content must be trully unique and immutable. Solution: The key is genrated based on the content (as content hash) using Contenet Addressing.

3. The content must be immutable and persistable forever. Solution: using Interplanetary File System (IPFS) to store the asset in the decentralized way. Improve the content persistance through Filecoin which uses Proof-Of-Replication to ensure the availability of the client's origial data, and Proof-Of-Spacetime to ensure that the data is stored continuisly overtime.

### NFT.Storage uses Filecoin to store & persist assets on IPFS

Requires account on [nft.storage](https://nft.storage)

<br/><br/>

Update NFT_STORAGE_API_KEY in .env

<br/><br/>

to upload asset & metadata to IPFS:

`node scripts/store-asset.mjs`

## Testing

1. Start Hardhat Node  
   `npx hardhat node`

2. Run the Tests  
   `npx hardhat test --network localhost --logs`
