// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProofChainRegistry
 * @dev Self-Sovereign Identity & Social Proof Verification Anchor
 * Anchors cryptographic proof that a user controls both their physical
 * selfie identity and a specific authorized social media publication.
 * Deployed to Polygon Amoy Testnet (Chain ID 80002).
 */
contract ProofChainRegistry {
    struct Record {
        uint256 timestamp;
        address submitter;
        bool exists;
    }

    // Mapping from proof root hash (Keccak-256 / bytes32) to on-chain record
    mapping(bytes32 => Record) public records;
    bytes32[] public allRecordHashes;

    // Event emitted when a new proof hash is permanently anchored
    event RecordSubmitted(
        bytes32 indexed recordHash,
        address indexed submitter,
        uint256 timestamp
    );

    /**
     * @notice Submits and anchors a unique proof root hash onto the blockchain.
     * @param hash The bytes32 Keccak-256 root hash derived from selfie + post image + post URL + timestamp.
     */
    function submitRecord(bytes32 hash) external {
        require(hash != bytes32(0), "ProofChain: Invalid zero hash");
        require(!records[hash].exists, "ProofChain: Record already anchored on-chain");

        records[hash] = Record({
            timestamp: block.timestamp,
            submitter: msg.sender,
            exists: true
        });

        allRecordHashes.push(hash);
        emit RecordSubmitted(hash, msg.sender, block.timestamp);
    }

    /**
     * @notice Retrieves verified record details by proof hash.
     * @param hash The bytes32 proof root hash to query.
     * @return timestamp The block timestamp when the record was anchored.
     * @return submitter The wallet address that submitted the proof.
     */
    function getRecord(bytes32 hash) external view returns (uint256 timestamp, address submitter) {
        Record memory rec = records[hash];
        require(rec.exists, "ProofChain: Record not found on-chain");
        return (rec.timestamp, rec.submitter);
    }

    /**
     * @notice Checks if a proof hash is currently anchored.
     * @param hash The bytes32 proof root hash.
     * @return True if the record exists on-chain, false otherwise.
     */
    function hasRecord(bytes32 hash) external view returns (bool) {
        return records[hash].exists;
    }

    /**
     * @notice Returns total number of proof records anchored in this registry.
     */
    function getTotalRecords() external view returns (uint256) {
        return allRecordHashes.length;
    }
}
