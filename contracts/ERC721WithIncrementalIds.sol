//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC721WithLazyMintingBase.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721WithIncrementalIds is ERC721WithLazyMintingBase {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 public constant PRICE = 0.1 ether;
    uint256 public constant MAX_SUPPLY = 100;

    constructor(string memory name, string memory symbol)
        ERC721WithLazyMintingBase(name, symbol)
    {}

    /**
     *  Mint NFT without a signature. Restricted to Admin (contract owner) only
     *
     */
    function mintNFT(
        address recipient,
        uint256 tokenId,
        string memory tokenURL
    ) external returns (uint256) {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Restricted: Not an Admin"
        );

        // Check if correct id was sent
        require(
            _tokenIds.current() + 1 == tokenId,
            "TokenId already minted or out of order"
        );
        require(tokenId <= MAX_SUPPLY, "Out of tokens");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURL);

        return newTokenId;
    }

    /**
     *  Redeems EIP712 signature for token
     *  Requires Payment = PRICE
     */
    function redeem(
        address recipient,
        uint256 tokenId,
        string memory tokenURL,
        bytes calldata signature
    ) external payable returns (uint256) {
        // Check if accounts is sending enough ether
        require(msg.value >= PRICE, "Not enough ether to purchase NFT");

        // Check if correct id was sent
        require(
            _tokenIds.current() + 1 == tokenId,
            "TokenId already minted or out of order"
        );
        require(tokenId <= MAX_SUPPLY, "Out of tokens");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _redeemSignatureForToken(recipient, newTokenId, tokenURL, signature);

        return newTokenId;
    }

    /**
     *  Get last tokenId that has been minted. Accessible by client
     *
     */
    function getLastTokenId() external view returns (uint256) {
        return _tokenIds.current();
    }

    /**
     *  Withdraw balance to Admin's wallet
     *
     */
    function withdraw() public payable {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Restricted: Not an Admin"
        );

        uint256 balance = address(this).balance;
        require(balance > 0, "No ether left to withdraw");

        (bool success, ) = (msg.sender).call{value: balance}("");
        require(success, "Transfer failed.");
    }
}
