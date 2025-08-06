// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IZkVerifySettlement
 * @dev Interface for zkVerify settlement contract on Horizen Testnet
 */
interface IZkVerifySettlement {
    /**
     * @dev Verifies proof aggregation using Merkle proof
     * @param root The Merkle root published by zkVerify
     * @param path The Merkle path (array of hashes)
     * @param index The leaf index in the Merkle tree
     * @param leaf The leaf data to verify
     * @return bool indicating whether the proof is valid
     */
    function verifyProofAggregation(
        bytes32 root,
        bytes32[] calldata path,
        uint256 index,
        bytes calldata leaf
    ) external view returns (bool);
}
