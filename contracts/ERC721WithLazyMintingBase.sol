//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ERC721WithLazyMintingBase is ERC721URIStorage, EIP712, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
        EIP712(name, "1.0.0")
    {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
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

    /**
     *  Redeems EIP712 signature for token
     *
     */
    function _redeemSignatureForToken(
        address recipient,
        uint256 tokenId,
        string memory tokenURL,
        bytes calldata signature
    ) internal {
        require(
            _validate(_hash(recipient, tokenId), signature),
            "Invalid Signature"
        );
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURL);
    }

    /**
     *   Reproduces the digest of recipient address & tokenId
     *
     */
    function _hash(address account, uint256 tokenId)
        internal
        view
        returns (bytes32)
    {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        keccak256("NFT(uint256 tokenId,address account)"),
                        tokenId,
                        account
                    )
                )
            );
    }

    /**
     *  Validates the Public Key extracted from signature has the MINTER_ROLE
     *
     */
    function _validate(bytes32 digest, bytes memory signature)
        internal
        view
        returns (bool)
    {
        return hasRole(MINTER_ROLE, ECDSA.recover(digest, signature));
    }
}
