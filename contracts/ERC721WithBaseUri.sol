//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721WithBaseUri is ERC721URIStorage, Ownable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 public constant PRICE = 0.1 ether;
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public constant MAX_MINT = 5;
    string public BASE_URI = "";

    constructor(
        string memory name,
        string memory symbol,
        string memory baseUri
    ) ERC721(name, symbol) {
        BASE_URI = baseUri;
    }

    // Overrides from ERC721 to set custom baseUri for all tokens
    function _baseURI()
        internal
        view
        virtual
        override(ERC721)
        returns (string memory)
    {
        return BASE_URI;
    }

    /**
     *  Redeems EIP712 signature for token
     *
     */
    function mint(address recipient, uint256 numOfTokens) external payable {
        require(
            _tokenIds.current() + numOfTokens <= MAX_SUPPLY,
            "Out of tokens"
        );
        require(numOfTokens <= MAX_MINT, "Can only mint 5 tokens at a time");
        require(
            PRICE.mul(numOfTokens) <= msg.value,
            "Ether value sent is not correct"
        );

        for (uint256 i = 0; i < numOfTokens; i++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();

            _safeMint(recipient, newTokenId);
        }
    }

    /**
     *  Withdraw balance to Admin's wallet
     *
     */
    function withdraw() public payable onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ether left to withdraw");

        (bool success, ) = (msg.sender).call{value: balance}("");
        require(success, "Transfer failed.");
    }
}
