import './App.css';
import ReactDOM from 'react-dom';
import { ethers, utils } from 'ethers';
import ERC721NFTs from './artifacts/contracts/ERC721NFTs.sol/ERC721NFTs.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const MINTER_PRIVATE_KEY = process.env.REACT_APP_MINTER_PRIVATE_KEY;
const META_DATA_URL = "https://ipfs.io/ipfs/bafyreiaavkxyf3yw3mva4mt3wphnc52fdvnu7zaiw46bdhh4uosydcihh4/metadata.json"
const SALE_PRICE = '0.1'
const TOKEN_ID = 1;

let account
let provider
let signer
let contract

let metadataIpfsUri = ""

let NFT_URL = ""

function App() {

  async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      account = (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0];
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, ERC721NFTs.abi, signer);
    }
  }

  // Only Owner can mint NFT directly
  async function mintNFT() {
    const minting = await contract.mintNFT(account, TOKEN_ID, META_DATA_URL);
    minting.wait();
    console.log("NFT successfuly minted! \nAssigned to address: ", JSON.stringify(account));
  }

  async function grantMinterRole(contract, address) {
    const grantRole = await contract.grantRole(await contract.MINTER_ROLE(), address);
    grantRole.wait();
  }

  /**
   * Redeems signature for wallet & tokenId
   */
   async function _redeemToken(reciever, tokenId, signature) {
    const redeeming = await contract.redeem(reciever, tokenId, META_DATA_URL, signature, { value: ethers.utils.parseEther('0.1') })
    redeeming.wait();
    console.log("Token successfully redeemed! \nNFT Assigned to account: ", account)
  }


  /**
   * Creates and cashes a set of siganatures for wallet entered into the text field
   */
  async function _createSignature(reciever, tokenId) {

      const minter = new ethers.Wallet(MINTER_PRIVATE_KEY)
      const minterAddress = await minter.getAddress();
      console.log('Minter address: ', minterAddress);

      const hasGrantedRole = await contract.hasRole(await contract.MINTER_ROLE(), minterAddress);
      if (!hasGrantedRole) {
        console.error("Minter is not assigned!")
      } else {
      
        const { chainId } = await provider.getNetwork();
        const account = reciever;

        const newSignature = await minter._signTypedData(
          // Domain
          {
            name: "name",
            version: "1.0.0",
            chainId: chainId,
            verifyingContract: contract.address
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

        return newSignature;

      }
  }


  /**
   *  Lazy mints new token
   */
  async function lazyMint() {

    const reciever = await signer.getAddress();
    const tokenId = 1;


    // Create Signatures
    let signature = await _createSignature(reciever, tokenId);

    if (signature) {
      try {
        await _redeemToken(reciever, tokenId, signature);
      } catch (err) {
        console.log(err);
      }
    }
  }

  /**
   * Assings MINTER_ROLE to the designated address that later will be used to create signatures
   */
  async function assignMinter() {

      const minter = new ethers.Wallet(MINTER_PRIVATE_KEY);
      const minterAddress = await minter.getAddress();
      console.log('Minter Address: ', minterAddress);

      const hasMinterRole = await contract.hasRole(await contract.MINTER_ROLE(), minterAddress);
      if (!hasMinterRole) {
        console.log("Grant MINTER_ROLE to: ", minterAddress);
        await grantMinterRole(contract, minterAddress);
      } else {
        console.log("Aready has MINTER_ROLE");
      }
  }

  async function balanceOf() {
    const balance = await contract.balanceOf(account);
    console.log(`Account has ${balance.toString()} NFTs`);
  }

  async function getName() {
    const name = await contract.name();
    console.log(`Token name is ${JSON.stringify(name)}`);
  }

  async function withdrawBalance() {
    try {
      const withdrawal = await contract.withdraw();
      withdrawal.wait();
      console.log("Withdrawal completed: ", JSON.stringify(withdrawal));
    } catch (err) {
      console.log("Error: ", err);
    }
  }

  async function getTokenUri() {
    const tokenUri = await contract.tokenURI(TOKEN_ID);
    console.log("Token URI: ", JSON.stringify(tokenUri));
    metadataIpfsUri = 'https://ipfs.io/ipfs' + tokenUri.substring(6);
    console.log('URL: ', metadataIpfsUri)
  }

  async function ownerOf() {
    try {
      const ownerOf = await contract.ownerOf(TOKEN_ID);
      console.log(`Owner of ${TOKEN_ID}: `, JSON.stringify(ownerOf))
    } catch (err) {
      console.log("There's no owner!", err)
    }
  }

  async function displayNFT() {
    if (metadataIpfsUri) {
      let resopnse = await fetch(metadataIpfsUri);
      let data = await resopnse.json()
      let imageUrl = data.image
      let realImageUrl = 'https://ipfs.io/ipfs' + imageUrl.substring(6);
      NFT_URL = realImageUrl;
      ReactDOM.render((
        <img src={NFT_URL} alt='unavailable'></img>
      ), document.getElementById('root'));
    }
  }

  // async function getRoyalties() {
  //   const salePriceWei = ethers.utils.parseEther(SALE_PRICE);
  //   const royalties = await contract.royaltyInfo(TOKEN_ID, salePriceWei);
  //   console.log("Royalties: ", JSON.stringify(royalties));
  //   if (royalties[1]) {
  //     const royaltyAmount = ethers.utils.formatEther(royalties[1])
  //     console.log("Royalty amount: ", royaltyAmount)
  //   }
  // }
  
  return (
    <div className="App">
      <header className="App-header">
        <button onClick={connectWallet}>Connect Wallet</button>
        <br></br>
        <button onClick={mintNFT}>Mint For Free as Owner</button>
        <br></br>
        <button onClick={assignMinter}>Assign Minter (Signer)</button>
        <br></br>
        <button onClick={lazyMint}>Mint</button>
        <br></br>
        <button onClick={balanceOf}>Get Balance</button>
        <br></br>
        <button onClick={getName}>Get Name</button>
        <br></br>
        <button onClick={withdrawBalance}>Withdraw Balance</button>
        <br></br>
        <button onClick={getTokenUri}>Get Token URI</button>
        <br></br>
        <button onClick={displayNFT}>Display NFT</button>
        <br></br>
        {/* <button onClick={getRoyalties}>Get royalties</button>
        <br></br> */}
        <button onClick={ownerOf}>Owner Of Token</button>
      </header>
    </div>
  );
}

export default App;
