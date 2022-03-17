//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC721WithLazyMintingBase.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";

contract ERC721WithRoyalties is ERC721WithLazyMintingBase, ERC721Royalty {
    using SafeMath for uint256;

    uint256 public constant PRICE = 0.1 ether;
    uint96 public constant DEFAULT_ROYALTY = 800; // In bps / 10000; 1% - 100bps

    constructor(string memory name, string memory symbol)
        ERC721WithLazyMintingBase(name, symbol)
    {
        // Set default royalty
        _setDefaultRoyalty(_msgSender(), DEFAULT_ROYALTY);
    }

    // Override supportsInterface in used in both parents ERC721 & AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721WithLazyMintingBase, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Override _burn function used in both ERC721 & ERC721Royalty
    function _burn(uint256 tokenId)
        internal
        virtual
        override(ERC721URIStorage, ERC721Royalty)
    {
        return ERC721Royalty._burn(tokenId);
    }

    // Override tokenURI used in the parent ERC721
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

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

        _redeemSignatureForToken(recipient, tokenId, tokenURL, signature);
        return tokenId;
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
