import crypto from 'crypto';
import { ethers } from 'ethers';

export interface ProofInput {
  selfieHash: string;
  postImageHash: string;
  postUrl: string;
  timestamp?: number;
}

export interface ComputedProof {
  selfieHash: string;
  postImageHash: string;
  postUrl: string;
  timestamp: number;
  sha256Proof: string;
  recordHash: string; // bytes32 Keccak-256 hex string with 0x prefix
}

/**
 * Computes a standard SHA-256 hex digest of any buffer or string
 */
export function computeSha256(data: Buffer | string): string {
  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Derives a canonical ProofChain bytes32 Keccak-256 root hash from the components
 */
export function buildProofHash(input: ProofInput): ComputedProof {
  const timestamp = input.timestamp || Date.now();
  const canonicalPayload = `${input.selfieHash}:${input.postImageHash}:${input.postUrl.trim()}:${timestamp}`;
  
  // Standard SHA-256 digest
  const sha256Proof = crypto.createHash('sha256').update(canonicalPayload).digest('hex');
  
  // Ethereum bytes32 Keccak-256 hash for EVM smart contracts
  const recordHash = ethers.keccak256(ethers.toUtf8Bytes(canonicalPayload));

  return {
    selfieHash: input.selfieHash,
    postImageHash: input.postImageHash,
    postUrl: input.postUrl.trim(),
    timestamp,
    sha256Proof,
    recordHash
  };
}

/**
 * Recomputes the Keccak-256 root hash given explicit parameters
 */
export function recomputeProofHash(
  selfieHash: string,
  postImageHash: string,
  postUrl: string,
  timestamp: number
): string {
  const canonicalPayload = `${selfieHash}:${postImageHash}:${postUrl.trim()}:${timestamp}`;
  return ethers.keccak256(ethers.toUtf8Bytes(canonicalPayload));
}
