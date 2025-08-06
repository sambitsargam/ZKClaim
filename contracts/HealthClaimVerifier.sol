// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ISettlement.sol";

/**
 * @title HealthClaimVerifier
 * @dev Contract for verifying health insurance claims using zkVerify proofs on Horizen Testnet
 */
contract HealthClaimVerifier {
    // zkVerify settlement contract interface
    IZkVerifySettlement public settlement;
    
    // Events
    event ClaimApproved(
        bytes32 indexed root,
        uint256 indexed index,
        bytes32 indexed leafHash,
        address approver
    );
    
    event ClaimRejected(
        bytes32 indexed root,
        uint256 indexed index,
        bytes32 indexed leafHash,
        address approver,
        string reason
    );
    
    // Errors
    error InvalidProof();
    error ZeroAddress();
    error EmptyPath();
    error EmptyLeaf();
    
    /**
     * @dev Constructor sets the zkVerify settlement contract address
     * @param _settlement Address of the zkVerify settlement contract on Horizen
     */
    constructor(address _settlement) {
        if (_settlement == address(0)) revert ZeroAddress();
        settlement = IZkVerifySettlement(_settlement);
    }
    
    /**
     * @dev Approves a health claim by verifying the zkVerify proof
     * @param root The Merkle root from zkVerify
     * @param path The Merkle path for proof verification
     * @param index The leaf index in the Merkle tree
     * @param leaf The leaf data (valid_claim_hash)
     * @return bool indicating successful approval
     */
    function approve(
        bytes32 root,
        bytes32[] calldata path,
        uint256 index,
        bytes calldata leaf
    ) external view returns (bool) {
        // Input validation
        if (root == bytes32(0)) revert InvalidProof();
        if (path.length == 0) revert EmptyPath();
        if (leaf.length == 0) revert EmptyLeaf();
        
        // Call the settlement contract to verify the proof
        return settlement.verifyProofAggregation(root, path, index, leaf);
    }
    
    /**
     * @dev Approves a claim and emits an event (transaction version)
     * @param root The Merkle root from zkVerify
     * @param path The Merkle path for proof verification
     * @param index The leaf index in the Merkle tree
     * @param leaf The leaf data (valid_claim_hash)
     */
    function approveAndEmit(
        bytes32 root,
        bytes32[] calldata path,
        uint256 index,
        bytes calldata leaf
    ) external {
        bool isValid = settlement.verifyProofAggregation(root, path, index, leaf);
        
        bytes32 leafHash = keccak256(leaf);
        
        if (isValid) {
            emit ClaimApproved(root, index, leafHash, msg.sender);
        } else {
            emit ClaimRejected(root, index, leafHash, msg.sender, "Invalid proof");
            revert InvalidProof();
        }
    }
    
    /**
     * @dev Returns the settlement contract address
     * @return address of the settlement contract
     */
    function getSettlementContract() external view returns (address) {
        return address(settlement);
    }
}
