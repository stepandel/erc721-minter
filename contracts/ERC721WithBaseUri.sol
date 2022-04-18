//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721WithBaseUri is ERC721URIStorage, AccessControl {
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
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        BASE_URI = baseUri;
    }

    // Overrides supportsInterface used in both parents ERC721 & AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
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
