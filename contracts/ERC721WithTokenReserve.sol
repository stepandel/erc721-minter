//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC721WithLazyMintingBase.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721WithTokenReserve is ERC721WithLazyMintingBase {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokens;

    uint256 public constant PRICE = 0.1 ether;
    uint256 constant RESERVED_TOKENS = 10;
    uint256 constant MAX_SUPPLY = 100;

    constructor(string memory name, string memory symbol)
        ERC721WithLazyMintingBase(name, symbol)
    {}

    /**
     * Mint NFT without a signature. Restricted to Admin (contract owner) only
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

        uint256 lastItemId = _tokens.current();

        require(
            lastItemId < MAX_SUPPLY - RESERVED_TOKENS,
            "Max Supply Reached"
        );

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURL);

        _tokens.increment();
        uint256 newItemId = _tokens.current();
        return newItemId;
    }

    /**
     * Mint NFT from the reserve. Can mint more than reserved if available.
     *
     */
    function mintReserved(
        address recipient,
        uint256 tokenId,
        string memory tokenURL
    ) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Restricted: Not an Admin"
        );

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURL);
    }

    /**
     * Redeems EIP712 signature for token
     * Requires Payment = PRICE
     */
    function redeem(
        address recipient,
        uint256 tokenId,
        string memory tokenURL,
        bytes calldata signature
    ) external payable returns (uint256) {
        // Check if accounts is sending enough ether
        require(msg.value >= PRICE, "Not enough ether to purchase NFT");

        uint256 lastItemId = _tokens.current();

        require(
            lastItemId < MAX_SUPPLY - RESERVED_TOKENS,
            "Max Supply Reached"
        );

        _redeemSignatureForToken(recipient, tokenId, tokenURL, signature);

        _tokens.increment();
        uint256 newItemId = _tokens.current();
        return newItemId;
    }

    /**
     * Withdraw balance to Admin's wallet
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
